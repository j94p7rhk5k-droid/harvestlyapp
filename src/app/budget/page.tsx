'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Calendar,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useBudget } from '@/hooks/useBudget';
import AppLayout from '@/components/layout/AppLayout';
import BudgetSection from '@/components/budget/BudgetSection';
import BudgetSummaryBar from '@/components/budget/BudgetSummaryBar';
import AddCategoryModal from '@/components/budget/AddCategoryModal';
import AddTransactionModal from '@/components/budget/AddTransactionModal';
import EmptyState from '@/components/ui/EmptyState';
import {
  formatCurrency,
  formatDate,
  getMonthName,
  cn,
} from '@/lib/utils';
import type { CategoryType, NewCategory, NewTransaction } from '@/types';

// ─── Animation variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// ─── Skeleton ───────────────────────────────────────────────────────────────

function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary bar skeleton */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 h-[72px]">
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-24 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Section skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-navy-900 border border-navy-800 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div>
                <div className="skeleton h-4 w-20 mb-1.5" />
                <div className="skeleton h-3 w-16" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-20" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section type order ─────────────────────────────────────────────────────

const SECTION_ORDER: CategoryType[] = ['income', 'expense', 'bill', 'savings', 'debt'];

// ─── Main page component ────────────────────────────────────────────────────

export default function BudgetPage() {
  const { user, userProfile, effectiveUserId } = useAuth();
  const { currentMonth } = useMonth();
  const {
    budgetMonth,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateBudgetPeriod,
    updateRollover,
  } = useBudget(effectiveUserId, currentMonth);

  const currency = userProfile?.currency ?? '$';

  // ── Modal state ─────────────────────────────────────────────────────────

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addCategoryType, setAddCategoryType] = useState<CategoryType>('expense');
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>();

  // ── Budget period editing ───────────────────────────────────────────────

  const [editingPeriod, setEditingPeriod] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Rollover editing ────────────────────────────────────────────────────

  const [editingRollover, setEditingRollover] = useState(false);
  const [rolloverValue, setRolloverValue] = useState('');
  const rolloverInputRef = useRef<HTMLInputElement>(null);

  // ── Computed data ───────────────────────────────────────────────────────

  const categories = budgetMonth?.categories ?? [];
  const transactions = budgetMonth?.transactions ?? [];

  const categoriesByType = useMemo(() => {
    const map: Record<CategoryType, typeof categories> = {
      income: [],
      expense: [],
      bill: [],
      savings: [],
      debt: [],
    };
    for (const cat of categories) {
      if (map[cat.type]) {
        map[cat.type].push(cat);
      }
    }
    return map;
  }, [categories]);

  const totals = useMemo(() => {
    const sumActual = (type: CategoryType) =>
      categoriesByType[type].reduce((s, c) => s + c.actual, 0);
    return {
      income: sumActual('income'),
      expense: sumActual('expense'),
      bill: sumActual('bill'),
      savings: sumActual('savings'),
      debt: sumActual('debt'),
    };
  }, [categoriesByType]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleOpenAddCategory = useCallback((type: CategoryType) => {
    setAddCategoryType(type);
    setAddCategoryOpen(true);
  }, []);

  const handleSaveCategory = useCallback(
    async (newCat: NewCategory) => {
      await addCategory(newCat);
    },
    [addCategory],
  );

  const handleOpenAddTransaction = useCallback((categoryId: string) => {
    setPreselectedCategoryId(categoryId);
    setAddTransactionOpen(true);
  }, []);

  const handleSaveTransaction = useCallback(
    async (newTx: NewTransaction) => {
      await addTransaction(newTx);
    },
    [addTransaction],
  );

  const handleStartEditPeriod = useCallback(() => {
    setStartDate(budgetMonth?.period.startDate ?? '');
    setEndDate(budgetMonth?.period.endDate ?? '');
    setEditingPeriod(true);
  }, [budgetMonth]);

  const handleSavePeriod = useCallback(async () => {
    if (startDate && endDate) {
      await updateBudgetPeriod({ startDate, endDate });
    }
    setEditingPeriod(false);
  }, [startDate, endDate, updateBudgetPeriod]);

  const handleStartEditRollover = useCallback(() => {
    setRolloverValue((budgetMonth?.rollover ?? 0).toString());
    setEditingRollover(true);
    // Focus after render
    setTimeout(() => rolloverInputRef.current?.focus(), 50);
  }, [budgetMonth]);

  const handleSaveRollover = useCallback(async () => {
    const parsed = parseFloat(rolloverValue);
    if (!isNaN(parsed)) {
      await updateRollover(parsed);
    }
    setEditingRollover(false);
  }, [rolloverValue, updateRollover]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Budget</h1>
            <p className="text-sm text-navy-400 mt-0.5">
              {getMonthName(currentMonth)} — Manage your income and spending
            </p>
          </div>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && <BudgetSkeleton />}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !budgetMonth && (
          <EmptyState
            icon={<Wallet className="w-7 h-7" />}
            title="No budget data yet"
            description="Your budget for this month will be created when you add your first category."
          />
        )}

        {/* ── Budget content ────────────────────────────────────────────────── */}
        {!loading && budgetMonth && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ── Top area: Period, Currency, Rollover ──────────────────────── */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {/* Budget period */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-navy-500" />
                    {editingPeriod ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-navy-800/60 border border-navy-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500/50"
                        />
                        <span className="text-navy-500 text-xs">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-navy-800/60 border border-navy-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand-500/50"
                        />
                        <button
                          onClick={handleSavePeriod}
                          className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPeriod(false)}
                          className="text-xs text-navy-500 hover:text-navy-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartEditPeriod}
                        className="text-sm text-navy-300 hover:text-white transition-colors"
                        title="Click to edit budget period"
                      >
                        {budgetMonth.period.startDate && budgetMonth.period.endDate
                          ? `${formatDate(budgetMonth.period.startDate)} — ${formatDate(budgetMonth.period.endDate)}`
                          : 'Set budget period'}
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-px h-6 bg-navy-800" />

                  {/* Currency */}
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-navy-500" />
                    <span className="text-sm text-navy-400">
                      Currency: <span className="text-white font-medium">{currency}</span>
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-px h-6 bg-navy-800" />

                  {/* Rollover */}
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-navy-500" />
                    {editingRollover ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-navy-400">Rollover:</span>
                        <input
                          ref={rolloverInputRef}
                          type="number"
                          value={rolloverValue}
                          onChange={(e) => setRolloverValue(e.target.value)}
                          onBlur={handleSaveRollover}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRollover();
                            if (e.key === 'Escape') setEditingRollover(false);
                          }}
                          className="bg-navy-800/60 border border-navy-600 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-brand-500/50 w-[100px] tabular-nums"
                          step={0.01}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={handleStartEditRollover}
                        className="text-sm text-navy-300 hover:text-white transition-colors"
                        title="Click to edit rollover amount"
                      >
                        Rollover:{' '}
                        <span className="font-medium text-white tabular-nums">
                          {formatCurrency(budgetMonth.rollover, currency)}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Summary bar ───────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <BudgetSummaryBar
                rollover={budgetMonth.rollover}
                totalIncome={totals.income}
                totalExpenses={totals.expense}
                totalBills={totals.bill}
                totalSavings={totals.savings}
                totalDebt={totals.debt}
                currency={currency}
              />
            </motion.div>

            {/* ── Budget sections ────────────────────────────────────────────── */}
            {SECTION_ORDER.map((sectionType) => (
              <motion.div key={sectionType} variants={itemVariants}>
                <BudgetSection
                  type={sectionType}
                  categories={categoriesByType[sectionType]}
                  transactions={transactions}
                  currency={currency}
                  onAddCategory={() => handleOpenAddCategory(sectionType)}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={deleteCategory}
                  onAddTransaction={handleOpenAddTransaction}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AddCategoryModal
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onSave={handleSaveCategory}
        defaultType={addCategoryType}
      />

      <AddTransactionModal
        open={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        preselectedCategoryId={preselectedCategoryId}
        currency={currency}
      />
    </AppLayout>
  );
}
