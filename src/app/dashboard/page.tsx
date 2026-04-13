'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Landmark,
  DollarSign,
  LayoutDashboard,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useBudget } from '@/hooks/useBudget';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ProgressRing from '@/components/charts/ProgressRing';
import CashFlowTable from '@/components/charts/CashFlowTable';
import DonutChart from '@/components/charts/DonutChart';
import SpendingBarChart from '@/components/charts/SpendingBarChart';
import TransactionList from '@/components/charts/TransactionList';
import {
  formatCurrency,
  cn,
  getCategoryColor,
  getMonthName,
} from '@/lib/utils';
import type { DashboardData, CategoryType } from '@/types';

// ─── Animation variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// ─── Skeleton components ────────────────────────────────────────────────────

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-navy-900 border border-navy-800 p-5', className)}>
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-32 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}

function SkeletonLarge({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-navy-900 border border-navy-800 p-5', className)}>
      <div className="skeleton h-4 w-32 mb-4" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Row 1: Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonLarge className="min-h-[280px]" />
        <SkeletonLarge className="min-h-[280px]" />
      </div>
      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonLarge className="min-h-[340px]" />
        <SkeletonLarge className="min-h-[340px]" />
      </div>
    </div>
  );
}

// ─── Overview card config ───────────────────────────────────────────────────

interface OverviewCardData {
  label: string;
  icon: React.ReactNode;
  actual: number;
  planned: number;
  iconBg: string;
  iconColor: string;
  type: 'income' | 'outflow';
}

// ─── Main page component ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, userProfile, effectiveUserId } = useAuth();
  const { currentMonth } = useMonth();
  const { budgetMonth, loading, addTransaction, addCategory } = useBudget(effectiveUserId, currentMonth);
  const currency = userProfile?.currency ?? '$';

  // ── Compute dashboard data ──────────────────────────────────────────────

  const dashboard = useMemo<DashboardData | null>(() => {
    if (!budgetMonth) return null;

    const cats = budgetMonth.categories ?? [];

    const sumBy = (type: CategoryType, field: 'planned' | 'actual') =>
      cats.filter((c) => c.type === type).reduce((sum, c) => sum + c[field], 0);

    const totalIncomePlanned = sumBy('income', 'planned');
    const totalIncomeActual = sumBy('income', 'actual');
    const totalExpensesPlanned = sumBy('expense', 'planned');
    const totalExpensesActual = sumBy('expense', 'actual');
    const totalBillsPlanned = sumBy('bill', 'planned');
    const totalBillsActual = sumBy('bill', 'actual');
    const totalSavingsPlanned = sumBy('savings', 'planned');
    const totalSavingsActual = sumBy('savings', 'actual');
    const totalDebtPlanned = sumBy('debt', 'planned');
    const totalDebtActual = sumBy('debt', 'actual');

    return {
      totalIncomePlanned,
      totalIncomeActual,
      totalExpensesPlanned,
      totalExpensesActual,
      totalBillsPlanned,
      totalBillsActual,
      totalSavingsPlanned,
      totalSavingsActual,
      totalDebtPlanned,
      totalDebtActual,
      leftToSpendPlanned:
        totalIncomePlanned - totalExpensesPlanned - totalBillsPlanned - totalSavingsPlanned - totalDebtPlanned,
      leftToSpendActual:
        totalIncomeActual - totalExpensesActual - totalBillsActual - totalSavingsActual - totalDebtActual,
    };
  }, [budgetMonth]);

  // ── Overview cards data ─────────────────────────────────────────────────

  const overviewCards = useMemo<OverviewCardData[]>(() => {
    if (!dashboard) return [];
    return [
      {
        label: 'Total Income',
        icon: <DollarSign className="w-5 h-5" />,
        actual: dashboard.totalIncomeActual,
        planned: dashboard.totalIncomePlanned,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        type: 'income',
      },
      {
        label: 'Total Expenses',
        icon: <ShoppingCart className="w-5 h-5" />,
        actual: dashboard.totalExpensesActual,
        planned: dashboard.totalExpensesPlanned,
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-400',
        type: 'outflow',
      },
      {
        label: 'Total Bills',
        icon: <Receipt className="w-5 h-5" />,
        actual: dashboard.totalBillsActual,
        planned: dashboard.totalBillsPlanned,
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-400',
        type: 'outflow',
      },
      {
        label: 'Total Savings',
        icon: <PiggyBank className="w-5 h-5" />,
        actual: dashboard.totalSavingsActual,
        planned: dashboard.totalSavingsPlanned,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        type: 'outflow',
      },
      {
        label: 'Total Debt',
        icon: <Landmark className="w-5 h-5" />,
        actual: dashboard.totalDebtActual,
        planned: dashboard.totalDebtPlanned,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        type: 'outflow',
      },
    ];
  }, [dashboard]);

  // ── Donut chart data ────────────────────────────────────────────────────

  const DONUT_COLORS = [
    '#c9922a', '#22c55e', '#6366f1', '#f97316', '#ec4899',
    '#14b8a6', '#a855f7', '#ef4444', '#3b82f6', '#eab308',
    '#06b6d4', '#f43f5e', '#84cc16', '#8b5cf6', '#fb923c',
  ];

  const donutData = useMemo(() => {
    if (!budgetMonth) return [];
    return (budgetMonth.categories ?? [])
      .filter((c) => c.type !== 'income' && c.actual > 0)
      .sort((a, b) => b.actual - a.actual)
      .map((c, i) => ({
        name: c.name,
        value: c.actual,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      }));
  }, [budgetMonth]);

  const totalAllocated = useMemo(
    () => donutData.reduce((s, d) => s + d.value, 0),
    [donutData],
  );

  // ── Spending bar chart data ─────────────────────────────────────────────

  const spendingData = useMemo(() => {
    if (!budgetMonth) return [];
    return (budgetMonth.categories ?? [])
      .filter((c) => c.type === 'expense' || c.type === 'bill')
      .filter((c) => c.actual > 0)
      .map((c) => ({
        name: c.name,
        amount: c.actual,
        type: c.type,
      }));
  }, [budgetMonth]);

  // ── Left to spend progress ──────────────────────────────────────────────

  const leftToSpendPct = useMemo(() => {
    if (!dashboard || dashboard.totalIncomeActual === 0) return 0;
    const totalOutflow =
      dashboard.totalExpensesActual +
      dashboard.totalBillsActual +
      dashboard.totalSavingsActual +
      dashboard.totalDebtActual;
    return Math.round((totalOutflow / dashboard.totalIncomeActual) * 100);
  }, [dashboard]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-navy-400 mt-0.5">
              {getMonthName(currentMonth)} overview
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && <DashboardSkeleton />}

        {/* Empty state */}
        {!loading && !budgetMonth && (
          <EmptyState
            icon={<LayoutDashboard className="w-7 h-7" />}
            title="No budget data yet"
            description="Set up your budget categories and add transactions to see your financial dashboard come to life."
          />
        )}

        {/* Empty categories */}
        {!loading && budgetMonth && (budgetMonth.categories ?? []).length === 0 && (
          <EmptyState
            icon={<BarChart3 className="w-7 h-7" />}
            title="No categories yet"
            description="Head to the Budget page to create your income and expense categories, then come back here for your dashboard."
          />
        )}

        {/* Dashboard content */}
        {!loading && dashboard && (budgetMonth?.categories ?? []).length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ── Row 1: Financial Overview Cards ──────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {overviewCards.map((card) => {
                const pct =
                  card.planned > 0
                    ? Math.round((card.actual / card.planned) * 100)
                    : 0;
                const isOver = card.type === 'outflow' && pct > 100;
                const isUnder = card.type === 'income' && pct < 100;

                return (
                  <motion.div key={card.label} variants={itemVariants}>
                    <Card noHover className="h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            card.iconBg,
                            card.iconColor,
                          )}
                        >
                          {card.icon}
                        </div>

                        {/* Trend indicator */}
                        {card.planned > 0 && (
                          <div
                            className={cn(
                              'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                              isOver
                                ? 'bg-red-500/10 text-red-400'
                                : isUnder
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-emerald-500/10 text-emerald-400',
                            )}
                          >
                            {pct > 100 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : pct < 100 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : null}
                            <span>{pct}%</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-medium text-navy-400 mb-1">
                        {card.label}
                      </p>
                      <p className="text-xl font-bold text-white tabular-nums">
                        {formatCurrency(card.actual, currency)}
                      </p>
                      <p className="text-xs text-navy-500 mt-1 tabular-nums">
                        Planned: {formatCurrency(card.planned, currency)}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Row 2: Left to Spend + Cash Flow ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left to Spend */}
              <motion.div variants={itemVariants}>
                <Card title="Left to Spend" className="h-full">
                  <div className="flex flex-col items-center py-4">
                    <ProgressRing
                      percentage={leftToSpendPct}
                      size={180}
                      strokeWidth={12}
                      centerValue={formatCurrency(
                        dashboard.leftToSpendActual + (budgetMonth?.rollover ?? 0),
                        currency,
                      )}
                      centerLabel={`${leftToSpendPct}% allocated`}
                    />

                    <div className="flex items-center gap-6 mt-6">
                      <div className="text-center">
                        <p className="text-xs text-navy-400 mb-0.5">Planned Left</p>
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {formatCurrency(
                            dashboard.leftToSpendPlanned + (budgetMonth?.rollover ?? 0),
                            currency,
                          )}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-navy-800" />
                      <div className="text-center">
                        <p className="text-xs text-navy-400 mb-0.5">Actual Left</p>
                        <p
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            dashboard.leftToSpendActual + (budgetMonth?.rollover ?? 0) >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400',
                          )}
                        >
                          {formatCurrency(
                            dashboard.leftToSpendActual + (budgetMonth?.rollover ?? 0),
                            currency,
                          )}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-navy-800" />
                      <div className="text-center">
                        <p className="text-xs text-navy-400 mb-0.5">Rollover</p>
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {formatCurrency(budgetMonth?.rollover ?? 0, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Cash Flow Summary */}
              <motion.div variants={itemVariants}>
                <Card title="Cash Flow Summary" className="h-full">
                  <CashFlowTable
                    rollover={budgetMonth?.rollover ?? 0}
                    incomePlanned={dashboard.totalIncomePlanned}
                    incomeActual={dashboard.totalIncomeActual}
                    expensesPlanned={dashboard.totalExpensesPlanned}
                    expensesActual={dashboard.totalExpensesActual}
                    billsPlanned={dashboard.totalBillsPlanned}
                    billsActual={dashboard.totalBillsActual}
                    savingsPlanned={dashboard.totalSavingsPlanned}
                    savingsActual={dashboard.totalSavingsActual}
                    debtPlanned={dashboard.totalDebtPlanned}
                    debtActual={dashboard.totalDebtActual}
                    currency={currency}
                  />
                </Card>
              </motion.div>
            </div>

            {/* ── Row 3: Allocation Donut + Spending Bars ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Allocation Summary (donut) */}
              <motion.div variants={itemVariants}>
                <Card title="Allocation Summary" className="h-full">
                  <DonutChart
                    data={donutData}
                    centerValue={formatCurrency(totalAllocated, currency)}
                    centerLabel="Total Spent"
                    currency={currency}
                  />
                </Card>
              </motion.div>

              {/* Spending Summary (horizontal bars) */}
              <motion.div variants={itemVariants}>
                <Card title="Top Spending Categories" className="h-full">
                  <SpendingBarChart
                    data={spendingData}
                    currency={currency}
                    maxItems={10}
                  />
                </Card>
              </motion.div>
            </div>

            {/* ── Row 4: Recent Transactions + Monthly Trend ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <motion.div variants={itemVariants}>
                <Card title="Recent Transactions" className="h-full">
                  <TransactionList
                    transactions={budgetMonth?.transactions ?? []}
                    currency={currency}
                    maxItems={10}
                  />
                </Card>
              </motion.div>

              {/* Monthly Trend placeholder */}
              <motion.div variants={itemVariants}>
                <Card title="Monthly Trend" className="h-full">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-navy-800/60 border border-navy-700/50 flex items-center justify-center text-navy-400 mb-4">
                      <BarChart3 className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-medium text-navy-300">
                      Monthly trend analysis
                    </p>
                    <p className="text-xs text-navy-500 mt-1 max-w-xs">
                      Track your spending patterns over multiple months. Data will appear as you build budget history.
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
