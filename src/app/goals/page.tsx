'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target, Landmark, Plus, PiggyBank } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholdGoals } from '@/hooks/useHouseholdGoals';
import AppLayout from '@/components/layout/AppLayout';
import SavingsGoalCard from '@/components/goals/SavingsGoalCard';
import DebtGoalCard from '@/components/goals/DebtGoalCard';
import AddGoalModal from '@/components/goals/AddGoalModal';
import GoalTransactionModal from '@/components/goals/GoalTransactionModal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import type {
  SavingsGoal,
  DebtGoal,
  NewSavingsGoal,
  NewDebtGoal,
  NewGoalTransaction,
  GoalType,
} from '@/types';

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

function GoalsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="skeleton h-6 w-40 mb-4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-navy-900 border border-navy-800 p-5">
              <div className="skeleton h-5 w-32 mb-3" />
              <div className="flex items-center gap-5">
                <div className="skeleton w-[100px] h-[100px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ────────────────────────────────────────────────────

export default function GoalsPage() {
  const { user, userProfile, effectiveUserId } = useAuth();
  const {
    savingsGoals,
    debtGoals,
    loading,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addDebtGoal,
    updateDebtGoal,
    deleteDebtGoal,
    addGoalTransaction,
    getGoalTransactions,
  } = useHouseholdGoals();

  const currency = userProfile?.currency ?? '$';

  // ── Modal state ────────────────────────────────────────────────────────
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalModalTab, setGoalModalTab] = useState<'savings' | 'debt'>('savings');
  const [editingSavings, setEditingSavings] = useState<SavingsGoal | null>(null);
  const [editingDebt, setEditingDebt] = useState<DebtGoal | null>(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txGoalId, setTxGoalId] = useState('');
  const [txGoalType, setTxGoalType] = useState<GoalType>('savings');
  const [txGoalName, setTxGoalName] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: 'savings' | 'debt';
    name: string;
  } | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleOpenAddSavings = useCallback(() => {
    setEditingSavings(null);
    setEditingDebt(null);
    setGoalModalTab('savings');
    setGoalModalOpen(true);
  }, []);

  const handleOpenAddDebt = useCallback(() => {
    setEditingSavings(null);
    setEditingDebt(null);
    setGoalModalTab('debt');
    setGoalModalOpen(true);
  }, []);

  const handleEditSavings = useCallback((goal: SavingsGoal) => {
    setEditingSavings(goal);
    setEditingDebt(null);
    setGoalModalTab('savings');
    setGoalModalOpen(true);
  }, []);

  const handleEditDebt = useCallback((goal: DebtGoal) => {
    setEditingDebt(goal);
    setEditingSavings(null);
    setGoalModalTab('debt');
    setGoalModalOpen(true);
  }, []);

  const handleDeleteSavings = useCallback((goalId: string) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    setDeleteConfirm({ id: goalId, type: 'savings', name: goal?.fundName ?? 'Goal' });
  }, [savingsGoals]);

  const handleDeleteDebt = useCallback((goalId: string) => {
    const goal = debtGoals.find((g) => g.id === goalId);
    setDeleteConfirm({ id: goalId, type: 'debt', name: goal?.debtName ?? 'Goal' });
  }, [debtGoals]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'savings') {
        await deleteSavingsGoal(deleteConfirm.id);
      } else {
        await deleteDebtGoal(deleteConfirm.id);
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteSavingsGoal, deleteDebtGoal]);

  const handleOpenTxModal = useCallback(
    (goalId: string, goalType: GoalType) => {
      setTxGoalId(goalId);
      setTxGoalType(goalType);

      if (goalType === 'savings') {
        const goal = savingsGoals.find((g) => g.id === goalId);
        setTxGoalName(goal?.fundName ?? 'Goal');
      } else {
        const goal = debtGoals.find((g) => g.id === goalId);
        setTxGoalName(goal?.debtName ?? 'Goal');
      }

      setTxModalOpen(true);
    },
    [savingsGoals, debtGoals],
  );

  const handleSaveSavings = useCallback(
    async (goal: NewSavingsGoal) => {
      await addSavingsGoal(goal);
    },
    [addSavingsGoal],
  );

  const handleSaveDebt = useCallback(
    async (goal: NewDebtGoal) => {
      await addDebtGoal(goal);
    },
    [addDebtGoal],
  );

  const handleSaveTx = useCallback(
    async (tx: NewGoalTransaction) => {
      await addGoalTransaction(tx);
    },
    [addGoalTransaction],
  );

  // ── Summary stats ──────────────────────────────────────────────────────

  const totalSavingsTarget = savingsGoals.reduce((s, g) => s + g.goalAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.startAmount + g.saved, 0);
  const totalDebtStart = debtGoals.reduce((s, g) => s + g.startDebt, 0);
  const totalPaidOff = debtGoals.reduce((s, g) => s + g.paidOff, 0);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Goals</h1>
            <p className="text-sm text-navy-400 mt-0.5">
              Track your savings goals and debt payoff progress
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && <GoalsSkeleton />}

        {/* Empty state */}
        {!loading && savingsGoals.length === 0 && debtGoals.length === 0 && (
          <EmptyState
            icon={<PiggyBank className="w-7 h-7" />}
            title="No goals yet"
            description="Create your first savings goal or debt payoff target to start tracking your progress."
            action={
              <div className="flex items-center gap-3">
                <Button
                  iconLeft={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddSavings}
                >
                  Add Savings Goal
                </Button>
                <Button
                  variant="secondary"
                  iconLeft={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddDebt}
                >
                  Add Debt Goal
                </Button>
              </div>
            }
          />
        )}

        {/* Goals content */}
        {!loading && (savingsGoals.length > 0 || debtGoals.length > 0) && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* ── Summary stats ─────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-xs text-navy-400">Savings Target</span>
                  </div>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {formatCurrency(totalSavingsTarget, currency)}
                  </p>
                </div>

                <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-navy-400">Total Saved</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(totalSaved, currency)}
                  </p>
                </div>

                <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs text-navy-400">Total Debt</span>
                  </div>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {formatCurrency(totalDebtStart, currency)}
                  </p>
                </div>

                <div className="rounded-2xl bg-navy-900 border border-navy-800 p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs text-navy-400">Debt Paid Off</span>
                  </div>
                  <p className="text-lg font-bold text-blue-400 tabular-nums">
                    {formatCurrency(totalPaidOff, currency)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Savings Goals ──────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Savings Goals</h2>
                    <p className="text-xs text-navy-400">
                      {savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  iconLeft={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddSavings}
                >
                  Add Goal
                </Button>
              </div>

              {savingsGoals.length === 0 ? (
                <div className="rounded-2xl bg-navy-900/50 border border-dashed border-navy-700 p-8 text-center">
                  <p className="text-sm text-navy-400">
                    No savings goals yet. Create one to start tracking.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {savingsGoals.map((goal) => (
                    <SavingsGoalCard
                      key={goal.id}
                      goal={goal}
                      currency={currency}
                      onEdit={handleEditSavings}
                      onDelete={handleDeleteSavings}
                      onAddTransaction={(goalId) => handleOpenTxModal(goalId, 'savings')}
                      getTransactions={getGoalTransactions}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Debt Goals ─────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Debt Goals</h2>
                    <p className="text-xs text-navy-400">
                      {debtGoals.length} goal{debtGoals.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddDebt}
                >
                  Add Goal
                </Button>
              </div>

              {debtGoals.length === 0 ? (
                <div className="rounded-2xl bg-navy-900/50 border border-dashed border-navy-700 p-8 text-center">
                  <p className="text-sm text-navy-400">
                    No debt goals yet. Create one to start tracking your payoff journey.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {debtGoals.map((goal) => (
                    <DebtGoalCard
                      key={goal.id}
                      goal={goal}
                      currency={currency}
                      onEdit={handleEditDebt}
                      onDelete={handleDeleteDebt}
                      onAddTransaction={(goalId) => handleOpenTxModal(goalId, 'debt')}
                      getTransactions={getGoalTransactions}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* ── Add/Edit Goal Modal ──────────────────────────────────────────── */}
      <AddGoalModal
        open={goalModalOpen}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingSavings(null);
          setEditingDebt(null);
        }}
        onSaveSavings={handleSaveSavings}
        onSaveDebt={handleSaveDebt}
        onUpdateSavings={updateSavingsGoal}
        onUpdateDebt={updateDebtGoal}
        userId={effectiveUserId ?? ''}
        defaultTab={goalModalTab}
        editingSavingsGoal={editingSavings}
        editingDebtGoal={editingDebt}
      />

      {/* ── Goal Transaction Modal ───────────────────────────────────────── */}
      <GoalTransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTx}
        goalId={txGoalId}
        goalType={txGoalType}
        goalName={txGoalName}
      />

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-backdrop-in"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl animate-modal-in p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Goal</h3>
            <p className="text-sm text-navy-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
