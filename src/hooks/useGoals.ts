'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  saveSavingsGoal as fsSaveSavingsGoal,
  deleteSavingsGoal as fsDeleteSavingsGoal,
  saveDebtGoal as fsSaveDebtGoal,
  deleteDebtGoal as fsDeleteDebtGoal,
  addGoalTransaction as fsAddGoalTransaction,
  getGoalTransactions as fsGetGoalTransactions,
} from '@/lib/firestore';
import { generateId } from '@/lib/utils';
import type {
  SavingsGoal,
  DebtGoal,
  GoalTransaction,
  NewSavingsGoal,
  NewDebtGoal,
  NewGoalTransaction,
} from '@/types';

interface UseGoalsReturn {
  savingsGoals: SavingsGoal[];
  debtGoals: DebtGoal[];
  loading: boolean;
  addSavingsGoal: (goal: NewSavingsGoal) => Promise<SavingsGoal>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  addDebtGoal: (goal: NewDebtGoal) => Promise<DebtGoal>;
  updateDebtGoal: (goal: DebtGoal) => Promise<void>;
  deleteDebtGoal: (goalId: string) => Promise<void>;
  addGoalTransaction: (transaction: NewGoalTransaction) => Promise<GoalTransaction>;
  getGoalTransactions: (goalId: string) => Promise<GoalTransaction[]>;
}

export function useGoals(userId: string | undefined): UseGoalsReturn {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debtGoals, setDebtGoals] = useState<DebtGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time listeners ────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setSavingsGoals([]);
      setDebtGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let savingsLoaded = false;
    let debtLoaded = false;

    const markLoaded = () => {
      if (savingsLoaded && debtLoaded) setLoading(false);
    };

    // Savings goals listener
    const savingsQ = query(collection(db, 'users', userId, 'savingsGoals'));
    const unsubSavings = onSnapshot(
      savingsQ,
      (snap) => {
        const goals = snap.docs.map((d) => d.data() as SavingsGoal);
        setSavingsGoals(goals);
        savingsLoaded = true;
        markLoaded();
      },
      (err) => {
        console.error('[useGoals] savings snapshot error:', err);
        savingsLoaded = true;
        markLoaded();
      },
    );

    // Debt goals listener
    const debtQ = query(collection(db, 'users', userId, 'debtGoals'));
    const unsubDebt = onSnapshot(
      debtQ,
      (snap) => {
        const goals = snap.docs.map((d) => d.data() as DebtGoal);
        setDebtGoals(goals);
        debtLoaded = true;
        markLoaded();
      },
      (err) => {
        console.error('[useGoals] debt snapshot error:', err);
        debtLoaded = true;
        markLoaded();
      },
    );

    return () => {
      unsubSavings();
      unsubDebt();
    };
  }, [userId]);

  // ── Savings goal mutations ─────────────────────────────────────────────

  const addSavingsGoal = useCallback(
    async (data: NewSavingsGoal): Promise<SavingsGoal> => {
      if (!userId) throw new Error('Not authenticated');
      const goal: SavingsGoal = {
        ...data,
        id: generateId(),
        saved: 0,
        remaining: Math.max(0, data.goalAmount - data.startAmount),
        progress: data.goalAmount > 0 ? Math.min(1, data.startAmount / data.goalAmount) : 0,
      };
      await fsSaveSavingsGoal(goal);
      return goal;
    },
    [userId],
  );

  const updateSavingsGoal = useCallback(
    async (goal: SavingsGoal): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      await fsSaveSavingsGoal(goal);
    },
    [userId],
  );

  const deleteSavingsGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      await fsDeleteSavingsGoal(userId, goalId);
    },
    [userId],
  );

  // ── Debt goal mutations ────────────────────────────────────────────────

  const addDebtGoal = useCallback(
    async (data: NewDebtGoal): Promise<DebtGoal> => {
      if (!userId) throw new Error('Not authenticated');
      const goal: DebtGoal = {
        ...data,
        id: generateId(),
        paidOff: 0,
        remaining: data.startDebt,
        progress: 0,
      };
      await fsSaveDebtGoal(goal);
      return goal;
    },
    [userId],
  );

  const updateDebtGoal = useCallback(
    async (goal: DebtGoal): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      await fsSaveDebtGoal(goal);
    },
    [userId],
  );

  const deleteDebtGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      await fsDeleteDebtGoal(userId, goalId);
    },
    [userId],
  );

  // ── Goal transaction mutations ─────────────────────────────────────────

  const addGoalTransaction = useCallback(
    async (transaction: NewGoalTransaction): Promise<GoalTransaction> => {
      if (!userId) throw new Error('Not authenticated');
      return fsAddGoalTransaction(userId, transaction);
    },
    [userId],
  );

  const getGoalTransactions = useCallback(
    async (goalId: string): Promise<GoalTransaction[]> => {
      if (!userId) throw new Error('Not authenticated');
      return fsGetGoalTransactions(userId, goalId);
    },
    [userId],
  );

  return {
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
  };
}
