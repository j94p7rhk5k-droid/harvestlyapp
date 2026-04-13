'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useHouseholdBudget } from '@/hooks/useHouseholdBudget';
import AppLayout from '@/components/layout/AppLayout';
import TransactionFilters, {
  type FilterState,
  type SortOption,
} from '@/components/transactions/TransactionFilters';
import TransactionTable from '@/components/transactions/TransactionTable';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ProgressRing from '@/components/charts/ProgressRing';
import { formatCurrency, getMonthName, cn } from '@/lib/utils';
import type { Transaction, CategoryType } from '@/types';

// ─── Animation variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Skeleton ───────────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4">
        <div className="flex gap-3">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-2 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-navy-900 border border-navy-800 p-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full rounded-lg mb-2" />
        ))}
      </div>
    </div>
  );
}

// ─── Category breakdown item ────────────────────────────────────────────────

const CATEGORY_COLORS: Record<CategoryType, string> = {
  income: '#22c55e',
  expense: '#f97316',
  bill: '#6366f1',
  savings: '#8b5cf6',
  debt: '#f59e0b',
};

// ─── Main page ──────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { user, userProfile } = useAuth();
  const { currentMonth } = useMonth();
  const { budgetMonth, loading, deleteTransaction } = useHouseholdBudget();

  const currency = userProfile?.currency ?? '$';
  const allTransactions = budgetMonth?.transactions ?? [];

  // ── Filter state ───────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    sort: 'newest',
  });

  // ── Filtered + sorted transactions ─────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.categoryName.toLowerCase().includes(q) ||
          (tx.note?.toLowerCase().includes(q) ?? false),
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter((tx) => tx.type === filters.type);
    }

    // Date range
    if (filters.dateFrom) {
      result = result.filter((tx) => tx.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((tx) => tx.date <= filters.dateTo);
    }

    // Sort
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case 'oldest':
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'highest':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  }, [allTransactions, filters]);

  // ── Summary stats ──────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const expenses = filteredTransactions
      .filter((tx) => tx.type !== 'income')
      .reduce((s, tx) => s + tx.amount, 0);

    // Category breakdown (top 5 by amount)
    const categoryMap = new Map<string, { name: string; amount: number; type: CategoryType }>();
    for (const tx of filteredTransactions) {
      const existing = categoryMap.get(tx.categoryId);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        categoryMap.set(tx.categoryId, {
          name: tx.categoryName,
          amount: tx.amount,
          type: tx.type,
        });
      }
    }
    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return { income, expenses, net: income - expenses, categories };
  }, [filteredTransactions]);

  const handleDelete = useCallback(
    async (txId: string) => {
      try {
        await deleteTransaction(txId);
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    },
    [deleteTransaction],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Transactions</h1>
            <p className="text-sm text-navy-400 mt-0.5">
              {getMonthName(currentMonth)} transaction history
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && <TransactionsSkeleton />}

        {/* Empty: no budget data at all */}
        {!loading && !budgetMonth && (
          <EmptyState
            icon={<ArrowLeftRight className="w-7 h-7" />}
            title="No transactions yet"
            description="Add categories and transactions in the Budget page to see them here."
          />
        )}

        {/* Content */}
        {!loading && budgetMonth && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ── Filters ──────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <Card noHover>
                <TransactionFilters
                  filters={filters}
                  onChange={setFilters}
                  totalResults={filteredTransactions.length}
                />
              </Card>
            </motion.div>

            {/* ── Main layout: Table + Summary sidebar ─────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Table (3/4 width on xl) */}
              <motion.div variants={itemVariants} className="xl:col-span-3">
                <TransactionTable
                  transactions={filteredTransactions}
                  currency={currency}
                  onDelete={handleDelete}
                />
              </motion.div>

              {/* Summary sidebar (1/4 width on xl) */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Income / Expense / Net summary */}
                <Card noHover title="Summary">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-xs text-navy-400">Income</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(summary.income, currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <span className="text-xs text-navy-400">Outflow</span>
                      </div>
                      <span className="text-sm font-semibold text-red-400 tabular-nums">
                        {formatCurrency(summary.expenses, currency)}
                      </span>
                    </div>

                    <div className="border-t border-navy-800 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <DollarSign className="w-3.5 h-3.5 text-brand-400" />
                          </div>
                          <span className="text-xs text-navy-400">Net</span>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            summary.net >= 0 ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {summary.net >= 0 ? '+' : ''}
                          {formatCurrency(summary.net, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Category breakdown */}
                <Card noHover title="By Category">
                  {summary.categories.length === 0 ? (
                    <p className="text-xs text-navy-500 text-center py-4">
                      No data to display
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {summary.categories.map((cat) => {
                        const total = summary.categories.reduce(
                          (s, c) => s + Math.abs(c.amount),
                          0,
                        );
                        const pct = total > 0 ? (Math.abs(cat.amount) / total) * 100 : 0;

                        return (
                          <div key={cat.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-navy-300 truncate mr-2">
                                {cat.name}
                              </span>
                              <span className="text-xs font-semibold text-white tabular-nums flex-shrink-0">
                                {formatCurrency(cat.amount, currency)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-navy-800/60 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor:
                                    CATEGORY_COLORS[cat.type] ?? '#94a3b8',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
