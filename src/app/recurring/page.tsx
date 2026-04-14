'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Repeat,
  DollarSign,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Landmark,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useHouseholdBudget } from '@/hooks/useHouseholdBudget';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import type { Transaction, CategoryType, RecurrenceFrequency } from '@/types';
import { getMonthlyOccurrences } from '@/lib/recurring';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const TYPE_CONFIG: Record<CategoryType, { icon: typeof DollarSign; label: string; color: string; bg: string }> = {
  income: { icon: DollarSign, label: 'Income', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  expense: { icon: ShoppingCart, label: 'Expenses', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  bill: { icon: Receipt, label: 'Bills', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  savings: { icon: PiggyBank, label: 'Savings', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  debt: { icon: Landmark, label: 'Debt', color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  semimonthly: 'Semi-monthly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

function getRecurringDay(date: string): string {
  const day = parseInt(date.split('-')[2] ?? '1', 10);
  const suffix =
    day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  return `${day}${suffix}`;
}

export default function RecurringPage() {
  const { userProfile } = useAuth();
  const { currentMonth } = useMonth();
  const { budgetMonth, loading } = useHouseholdBudget();
  const currency = userProfile?.currency ?? '$';

  // Get unique recurring transactions grouped by type (deduplicated)
  const recurringByType = useMemo(() => {
    if (!budgetMonth) return {} as Record<CategoryType, Transaction[]>;

    const recurring = budgetMonth.transactions.filter((t) => t.isRecurring);

    // Deduplicate: one entry per categoryName + type + amount + frequency
    const seen = new Set<string>();
    const unique = recurring.filter((tx) => {
      const key = `${tx.categoryName.toLowerCase()}-${tx.type}-${tx.amount}-${tx.recurrenceFrequency ?? 'monthly'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const grouped: Record<string, Transaction[]> = {};
    for (const tx of unique) {
      if (!grouped[tx.type]) grouped[tx.type] = [];
      grouped[tx.type].push(tx);
    }

    return grouped as Record<CategoryType, Transaction[]>;
  }, [budgetMonth]);

  // Monthly estimates based on frequency
  const totalRecurringIncome = useMemo(() => {
    return (recurringByType.income ?? []).reduce(
      (sum, tx) => sum + tx.amount * getMonthlyOccurrences(tx.recurrenceFrequency),
      0,
    );
  }, [recurringByType]);

  const totalRecurringOut = useMemo(() => {
    return Object.entries(recurringByType)
      .filter(([type]) => type !== 'income')
      .flatMap(([, txs]) => txs)
      .reduce((sum, tx) => sum + tx.amount * getMonthlyOccurrences(tx.recurrenceFrequency), 0);
  }, [recurringByType]);
  const typeOrder: CategoryType[] = ['income', 'bill', 'debt', 'expense', 'savings'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Recurring</h1>
          <p className="text-sm text-navy-400 mt-0.5">
            All your recurring income, bills, and expenses
          </p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-navy-900 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && Object.keys(recurringByType).length === 0 && (
          <EmptyState
            icon={<Repeat className="w-7 h-7" />}
            title="No recurring transactions"
            description="Mark transactions as recurring when adding them, and they'll show up here with details on frequency and scheduling."
          />
        )}

        {!loading && Object.keys(recurringByType).length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Summary cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card noHover>
                <p className="text-xs text-navy-500 mb-1">Recurring Income</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(totalRecurringIncome, currency)}
                </p>
                <p className="text-[10px] text-navy-600 mt-1">per month</p>
              </Card>
              <Card noHover>
                <p className="text-xs text-navy-500 mb-1">Recurring Outflow</p>
                <p className="text-xl font-bold text-rose-400 tabular-nums">
                  {formatCurrency(totalRecurringOut, currency)}
                </p>
                <p className="text-[10px] text-navy-600 mt-1">per month</p>
              </Card>
              <Card noHover>
                <p className="text-xs text-navy-500 mb-1">Net Recurring</p>
                <p className={cn(
                  'text-xl font-bold tabular-nums',
                  totalRecurringIncome - totalRecurringOut >= 0 ? 'text-emerald-400' : 'text-rose-400',
                )}>
                  {formatCurrency(totalRecurringIncome - totalRecurringOut, currency)}
                </p>
                <p className="text-[10px] text-navy-600 mt-1">per month</p>
              </Card>
            </motion.div>

            {/* Recurring items by type */}
            {typeOrder.map((type) => {
              const items = recurringByType[type];
              if (!items || items.length === 0) return null;
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;

              return (
                <motion.div key={type} variants={itemVariants}>
                  <Card noHover>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <h2 className={cn('text-sm font-semibold', config.color)}>
                        {config.label}
                      </h2>
                      <span className="text-xs text-navy-500">
                        ({items.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-navy-800/20 border border-navy-800/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Repeat className={cn('w-4 h-4 flex-shrink-0', config.color)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {tx.categoryName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {tx.note && (
                                  <span className="text-[11px] text-navy-400 truncate">
                                    {tx.note}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-white tabular-nums">
                                {formatCurrency(tx.amount, currency)}
                              </p>
                              {(tx.recurrenceFrequency === 'biweekly' ||
                                tx.recurrenceFrequency === 'weekly' ||
                                tx.recurrenceFrequency === 'semimonthly') && (
                                <p className="text-[10px] text-navy-400 tabular-nums">
                                  ~{formatCurrency(tx.amount * getMonthlyOccurrences(tx.recurrenceFrequency), currency)}/mo
                                </p>
                              )}
                              <div className="flex items-center gap-1 justify-end mt-0.5">
                                <Calendar className="w-3 h-3 text-navy-500" />
                                <span className="text-[10px] text-navy-500">
                                  {FREQUENCY_LABELS[tx.recurrenceFrequency ?? 'monthly'] ?? 'Monthly'} on the {getRecurringDay(tx.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
