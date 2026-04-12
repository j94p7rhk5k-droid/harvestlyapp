'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ArrowLeftRight,
  DollarSign,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Landmark,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Transaction, CategoryType } from '@/types';

// ─── Type badge config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  CategoryType,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  income: {
    label: 'Income',
    icon: <DollarSign className="w-3 h-3" />,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  expense: {
    label: 'Expense',
    icon: <ShoppingCart className="w-3 h-3" />,
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
  },
  bill: {
    label: 'Bill',
    icon: <Receipt className="w-3 h-3" />,
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  savings: {
    label: 'Savings',
    icon: <PiggyBank className="w-3 h-3" />,
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  debt: {
    label: 'Debt',
    icon: <Landmark className="w-3 h-3" />,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  onDelete: (transactionId: string) => void;
  /** Items per page for pagination */
  pageSize?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TransactionTable({
  transactions,
  currency,
  onDelete,
  pageSize = 15,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const totalPages = Math.ceil(transactions.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paged = transactions.slice(start, start + pageSize);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="w-7 h-7" />}
        title="No transactions found"
        description="No transactions match your current filters. Try adjusting your search or filter criteria."
      />
    );
  }

  return (
    <div>
      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-navy-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-900/80">
                <th className="text-left text-xs font-medium text-navy-400 px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-navy-400 px-4 py-3">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-navy-400 px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-navy-400 px-4 py-3">
                  Note
                </th>
                <th className="text-right text-xs font-medium text-navy-400 px-4 py-3">
                  Amount
                </th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((tx, idx) => {
                  const config = TYPE_CONFIG[tx.type];
                  const isIncome = tx.type === 'income';

                  return (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      onMouseEnter={() => setHoveredRow(tx.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={cn(
                        'border-t border-navy-800/50 transition-colors',
                        idx % 2 === 0 ? 'bg-navy-900/30' : 'bg-navy-900/60',
                        'hover:bg-navy-800/40',
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-navy-300 tabular-nums">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white font-medium">
                          {tx.categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                            config.bg,
                            config.text,
                            config.border,
                          )}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-400 max-w-[200px] truncate">
                        {tx.note || '-'}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-sm font-semibold tabular-nums text-right',
                          isIncome ? 'text-emerald-400' : 'text-white',
                        )}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => onDelete(tx.id)}
                          className={cn(
                            'p-1.5 rounded-lg text-navy-600 hover:text-red-400 hover:bg-red-500/10 transition-all',
                            hoveredRow === tx.id ? 'opacity-100' : 'opacity-0',
                          )}
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {paged.map((tx, idx) => {
          const config = TYPE_CONFIG[tx.type];
          const isIncome = tx.type === 'income';

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="rounded-xl bg-navy-900 border border-navy-800 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.categoryName}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">{tx.note || 'No note'}</p>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums flex-shrink-0 ml-3',
                    isIncome ? 'text-emerald-400' : 'text-white',
                  )}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      config.bg,
                      config.text,
                      config.border,
                    )}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                  <span className="text-xs text-navy-500 tabular-nums">
                    {formatDate(tx.date)}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="p-1.5 rounded-lg text-navy-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-800/50">
          <p className="text-xs text-navy-500">
            Showing {start + 1}-{Math.min(start + pageSize, transactions.length)} of{' '}
            {transactions.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                currentPage === 1
                  ? 'text-navy-600 cursor-not-allowed'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800/50',
              )}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    currentPage === page
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-navy-400 hover:text-white hover:bg-navy-800/50',
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                currentPage === totalPages
                  ? 'text-navy-600 cursor-not-allowed'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800/50',
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
