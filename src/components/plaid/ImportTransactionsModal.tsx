'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Square,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Download,
  CheckCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ProgressBar from '@/components/ui/ProgressBar';
import { categorizeTransaction } from '@/lib/categorizer';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, NewCategory, NewTransaction, CategoryType } from '@/types';
import type { PlaidSyncedTransaction } from '@/hooks/usePlaidAccounts';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ImportTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  transactions: PlaidSyncedTransaction[];
  userId: string;
  month: string;
  existingCategories: Category[];
  onImport: (params: {
    addTransaction: (tx: NewTransaction) => Promise<any>;
    addCategory: (cat: NewCategory) => Promise<Category>;
  }) => void;
  addTransaction: (tx: NewTransaction) => Promise<any>;
  addCategory: (cat: NewCategory) => Promise<Category>;
  /** Set of plaidTransactionIds that are already imported */
  importedIds?: Set<string>;
}

// ─── Row type with auto-categorization ──────────────────────────────────────

interface ImportRow {
  transaction: PlaidSyncedTransaction;
  selected: boolean;
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  overrideCategoryId: string | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImportTransactionsModal({
  open,
  onClose,
  transactions,
  userId,
  month,
  existingCategories,
  addTransaction,
  addCategory,
  importedIds = new Set(),
}: ImportTransactionsModalProps) {
  // ── Build rows with auto-categorization ───────────────────────────────

  const initialRows = useMemo((): ImportRow[] => {
    // Filter out already-imported and build categorization
    return transactions
      .filter((tx) => !importedIds.has(tx.plaidTransactionId))
      .map((tx) => {
        const result = categorizeTransaction(
          tx.category,
          tx.detailedCategory,
          tx.merchantName,
          tx.isIncome,
          existingCategories,
        );
        return {
          transaction: tx,
          selected: !tx.pending, // Pre-select non-pending
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          type: result.type,
          overrideCategoryId: null,
        };
      });
  }, [transactions, existingCategories, importedIds]);

  const [rows, setRows] = useState<ImportRow[]>(initialRows);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Reset rows when modal re-opens with new data
  useMemo(() => {
    if (open) {
      setRows(initialRows);
      setImporting(false);
      setImportProgress(0);
      setImportDone(false);
      setImportError(null);
    }
  }, [open, initialRows]);

  // ── Selection helpers ─────────────────────────────────────────────────

  const selectedCount = rows.filter((r) => r.selected).length;
  const allSelected = selectedCount === rows.length && rows.length > 0;

  const toggleAll = useCallback(() => {
    const newVal = !allSelected;
    setRows((prev) => prev.map((r) => ({ ...r, selected: newVal })));
  }, [allSelected]);

  const toggleRow = useCallback((plaidId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.transaction.plaidTransactionId === plaidId
          ? { ...r, selected: !r.selected }
          : r,
      ),
    );
  }, []);

  // ── Category override ─────────────────────────────────────────────────

  const handleCategoryChange = useCallback(
    (plaidId: string, newCategoryId: string) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.transaction.plaidTransactionId !== plaidId) return r;

          const cat = existingCategories.find((c) => c.id === newCategoryId);
          if (cat) {
            return {
              ...r,
              overrideCategoryId: newCategoryId,
              categoryId: cat.id,
              categoryName: cat.name,
              type: cat.type,
            };
          }
          return r;
        }),
      );
    },
    [existingCategories],
  );

  // ── Category select options ───────────────────────────────────────────

  const categoryOptions = useMemo(() => {
    const grouped: Record<CategoryType, { value: string; label: string }[]> = {
      income: [],
      expense: [],
      bill: [],
      savings: [],
      debt: [],
    };

    existingCategories.forEach((c) => {
      grouped[c.type]?.push({ value: c.id, label: c.name });
    });

    const options: { value: string; label: string }[] = [];
    const typeLabels: Record<CategoryType, string> = {
      income: 'Income',
      expense: 'Expenses',
      bill: 'Bills',
      savings: 'Savings',
      debt: 'Debt',
    };

    for (const [type, items] of Object.entries(grouped)) {
      if (items.length > 0) {
        items.forEach((item) => {
          options.push({
            value: item.value,
            label: `${item.label} (${typeLabels[type as CategoryType]})`,
          });
        });
      }
    }

    return options;
  }, [existingCategories]);

  // ── Import handler ────────────────────────────────────────────────────

  const handleImport = async () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;

    setImporting(true);
    setImportTotal(selected.length);
    setImportProgress(0);
    setImportError(null);

    // Track newly created categories to avoid duplicates
    const createdCategories = new Map<string, Category>();
    let successCount = 0;

    try {
      for (let i = 0; i < selected.length; i++) {
        const row = selected[i];
        let categoryId = row.categoryId;
        let categoryName = row.categoryName;
        let categoryType = row.type;

        // If no existing category matched, we need to create one
        if (!categoryId) {
          const cacheKey = `${categoryType}:${categoryName}`;

          if (createdCategories.has(cacheKey)) {
            // Reuse previously created category in this batch
            const existing = createdCategories.get(cacheKey)!;
            categoryId = existing.id;
            categoryName = existing.name;
          } else {
            // Create the category
            const newCat: NewCategory = {
              name: categoryName,
              type: categoryType,
              planned: 0,
            };

            const created = await addCategory(newCat);
            categoryId = created.id;
            categoryName = created.name;
            createdCategories.set(cacheKey, created);
          }
        }

        // Add the transaction
        const newTx: NewTransaction = {
          categoryId,
          categoryName,
          type: categoryType,
          amount: row.transaction.amount,
          date: row.transaction.date,
          note: row.transaction.merchantName || row.transaction.name,
          isRecurring: false,
        };

        await addTransaction(newTx);
        successCount++;
        setImportProgress(i + 1);
      }

      setImportCount(successCount);
      setImportDone(true);
    } catch (err: any) {
      console.error('[ImportTransactions] error:', err);
      setImportError(
        `Import failed after ${successCount} of ${selected.length} transactions. ${err.message || ''}`,
      );
    } finally {
      setImporting(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────

  const renderCheckbox = (checked: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-navy-400 hover:text-white transition-colors"
    >
      {checked ? (
        <CheckSquare className="w-5 h-5 text-brand-400" />
      ) : (
        <Square className="w-5 h-5" />
      )}
    </button>
  );

  // ── Footer ────────────────────────────────────────────────────────────

  const footer = importDone ? (
    <Button variant="primary" size="sm" onClick={onClose}>
      Done
    </Button>
  ) : (
    <>
      <Button variant="ghost" size="sm" onClick={onClose} disabled={importing}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        iconLeft={<Download className="w-4 h-4" />}
        onClick={handleImport}
        loading={importing}
        disabled={selectedCount === 0}
      >
        Import {selectedCount > 0 ? `${selectedCount} Selected` : 'Selected'}
      </Button>
    </>
  );

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={importing ? () => {} : onClose}
      title="Import Transactions"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      {/* Success state */}
      {importDone && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Import Complete
          </h3>
          <p className="text-sm text-navy-400">
            Successfully imported {importCount} transaction
            {importCount !== 1 ? 's' : ''} into your budget.
          </p>
        </div>
      )}

      {/* Import progress */}
      {importing && (
        <div className="mb-4">
          <ProgressBar
            value={
              importTotal > 0
                ? Math.round((importProgress / importTotal) * 100)
                : 0
            }
            label={`Importing ${importProgress} of ${importTotal}...`}
            color="bg-brand-500"
          />
        </div>
      )}

      {/* Error */}
      {importError && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{importError}</p>
        </div>
      )}

      {/* Transaction list */}
      {!importDone && (
        <>
          {/* Empty */}
          {rows.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-navy-400">
                All transactions have already been imported.
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-brand-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-xs text-navy-500">
                  {rows.length} transaction{rows.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {/* Rows */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {rows.map((row) => {
                  const tx = row.transaction;
                  const isIncome = tx.isIncome;

                  return (
                    <div
                      key={tx.plaidTransactionId}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
                        ${
                          row.selected
                            ? 'bg-navy-800/60 border-navy-700'
                            : 'bg-navy-900/40 border-navy-800/50 opacity-60'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      {renderCheckbox(row.selected, () =>
                        toggleRow(tx.plaidTransactionId),
                      )}

                      {/* Income/expense indicator */}
                      {isIncome ? (
                        <ArrowDownCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">
                            {tx.merchantName || tx.name}
                          </p>
                          {tx.pending && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-2.5 h-2.5" />
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-navy-500">
                          {formatDate(tx.date)}
                        </p>
                      </div>

                      {/* Amount */}
                      <span
                        className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                          isIncome ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>

                      {/* Category dropdown */}
                      <div className="w-40 flex-shrink-0">
                        <select
                          value={row.overrideCategoryId || row.categoryId || ''}
                          onChange={(e) =>
                            handleCategoryChange(
                              tx.plaidTransactionId,
                              e.target.value,
                            )
                          }
                          className="w-full appearance-none rounded-lg border px-2 py-1.5 text-xs
                            bg-navy-800/60 border-navy-700 text-white
                            transition-all duration-200 outline-none
                            focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
                        >
                          {/* Show auto-assigned if no existing match */}
                          {!row.categoryId && (
                            <option value="" className="bg-navy-900 text-navy-400">
                              + {row.categoryName} ({row.type})
                            </option>
                          )}
                          {categoryOptions.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-navy-900 text-white"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
