'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Landmark,
  RotateCcw,
  Equal,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface BudgetSummaryBarProps {
  rollover: number;
  totalIncome: number;
  totalExpenses: number;
  totalBills: number;
  totalSavings: number;
  totalDebt: number;
  currency: string;
}

// ─── Item config ────────────────────────────────────────────────────────────

interface SummaryItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  operator?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BudgetSummaryBar({
  rollover,
  totalIncome,
  totalExpenses,
  totalBills,
  totalSavings,
  totalDebt,
  currency,
}: BudgetSummaryBarProps) {
  const left = rollover + totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;

  const items: SummaryItem[] = [
    {
      label: 'Rollover',
      value: rollover,
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      color: 'text-navy-300',
      bgColor: 'bg-navy-800/60',
      operator: '+',
    },
    {
      label: 'Income',
      value: totalIncome,
      icon: <ArrowDownLeft className="w-3.5 h-3.5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      operator: '-',
    },
    {
      label: 'Expenses',
      value: totalExpenses,
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      operator: '-',
    },
    {
      label: 'Bills',
      value: totalBills,
      icon: <Receipt className="w-3.5 h-3.5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      operator: '-',
    },
    {
      label: 'Savings',
      value: totalSavings,
      icon: <PiggyBank className="w-3.5 h-3.5" />,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      operator: '-',
    },
    {
      label: 'Debt',
      value: totalDebt,
      icon: <Landmark className="w-3.5 h-3.5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2 md:gap-3">
            {/* Mini card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-800/50',
                item.bgColor,
              )}
            >
              <div className={cn('flex-shrink-0', item.color)}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-navy-400 uppercase tracking-wider leading-none mb-0.5">
                  {item.label}
                </p>
                <p className={cn('text-sm font-bold tabular-nums', item.color)}>
                  {formatCurrency(item.value, currency)}
                </p>
              </div>
            </motion.div>

            {/* Operator between items */}
            {item.operator && (
              <span className="text-xs font-bold text-navy-500 hidden sm:block">
                {item.operator}
              </span>
            )}
          </div>
        ))}

        {/* Equals + Left */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs font-bold text-navy-500 hidden sm:block">
            =
          </span>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border',
              left >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20',
            )}
          >
            <Equal className={cn('w-3.5 h-3.5 flex-shrink-0', left >= 0 ? 'text-emerald-400' : 'text-red-400')} />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-navy-400 uppercase tracking-wider leading-none mb-0.5">
                Left
              </p>
              <p
                className={cn(
                  'text-sm font-bold tabular-nums',
                  left >= 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {formatCurrency(left, currency)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
