'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn, formatCurrency, formatDate, getCategoryColor } from '@/lib/utils';
import type { Transaction } from '@/types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface TransactionListProps {
  transactions: Transaction[];
  currency?: string;
  maxItems?: number;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TransactionList({
  transactions,
  currency = '$',
  maxItems = 10,
  className,
}: TransactionListProps) {
  // Sort by date descending, take first N
  const sorted = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-navy-400">No transactions yet</p>
        <p className="text-xs text-navy-500 mt-1">
          Add your first transaction to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Transaction rows */}
      <div className="space-y-1">
        {sorted.map((tx) => {
          const isIncome = tx.type === 'income';
          const dotColor = getCategoryColor(tx.type);

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-navy-800/30 transition-colors group"
            >
              {/* Colored dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: dotColor }}
              />

              {/* Category + note */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {tx.categoryName}
                </p>
                {tx.note && (
                  <p className="text-xs text-navy-400 truncate mt-0.5">
                    {tx.note}
                  </p>
                )}
              </div>

              {/* Date */}
              <span className="text-xs text-navy-500 flex-shrink-0 hidden sm:block">
                {formatDate(tx.date)}
              </span>

              {/* Amount */}
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums flex-shrink-0',
                  isIncome ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(tx.amount, currency)}
              </span>
            </div>
          );
        })}
      </div>

      {/* View All link */}
      <Link
        href="/transactions"
        className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-navy-800/50 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors group"
      >
        <span>View all transactions</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
