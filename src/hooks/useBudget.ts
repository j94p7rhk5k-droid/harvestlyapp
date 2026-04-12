'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getBudgetMonth,
  saveBudgetMonth,
  addCategory as fsAddCategory,
  updateCategory as fsUpdateCategory,
  deleteCategory as fsDeleteCategory,
  addTransaction as fsAddTransaction,
  deleteTransaction as fsDeleteTransaction,
} from '@/lib/firestore';
import type {
  BudgetMonth,
  BudgetPeriod,
  Category,
  NewCategory,
  NewTransaction,
  Transaction,
} from '@/types';

interface UseBudgetReturn {
  budgetMonth: BudgetMonth | null;
  loading: boolean;
  error: string | null;
  addCategory: (category: NewCategory) => Promise<Category>;
  updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addTransaction: (transaction: NewTransaction) => Promise<Transaction>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  updateBudgetPeriod: (period: Partial<BudgetPeriod>) => Promise<void>;
  updateRollover: (amount: number) => Promise<void>;
}

export function useBudget(userId: string | undefined, month: string): UseBudgetReturn {
  const [budgetMonth, setBudgetMonth] = useState<BudgetMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Real-time listener ─────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setBudgetMonth(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let cancelled = false;
    let unsubRef: (() => void) | null = null;

    (async () => {
      try {
        await getBudgetMonth(userId, month);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to initialise budget month');
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      const ref = doc(db, 'users', userId, 'budgetMonths', month);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as BudgetMonth;
            recalcActuals(data);
            setBudgetMonth(data);
          } else {
            setBudgetMonth(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('[useBudget] snapshot error:', err);
          setError(err.message);
          setLoading(false);
        },
      );

      if (!cancelled) {
        unsubRef = unsub;
      } else {
        unsub();
      }
    })();

    return () => {
      cancelled = true;
      unsubRef?.();
    };
  }, [userId, month]);

  // ── Mutation helpers ───────────────────────────────────────────────────

  const addCategory = useCallback(
    async (category: NewCategory): Promise<Category> => {
      if (!userId) throw new Error('Not authenticated');
      return fsAddCategory(userId, month, category);
    },
    [userId, month],
  );

  const updateCategory = useCallback(
    async (categoryId: string, updates: Partial<Category>): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      return fsUpdateCategory(userId, month, categoryId, updates);
    },
    [userId, month],
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      return fsDeleteCategory(userId, month, categoryId);
    },
    [userId, month],
  );

  const addTransaction = useCallback(
    async (transaction: NewTransaction): Promise<Transaction> => {
      if (!userId) throw new Error('Not authenticated');
      return fsAddTransaction(userId, month, transaction);
    },
    [userId, month],
  );

  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      return fsDeleteTransaction(userId, month, transactionId);
    },
    [userId, month],
  );

  const updateBudgetPeriod = useCallback(
    async (periodUpdates: Partial<BudgetPeriod>): Promise<void> => {
      if (!userId || !budgetMonth) throw new Error('Not authenticated');
      const updated: BudgetMonth = {
        ...budgetMonth,
        period: { ...budgetMonth.period, ...periodUpdates },
      };
      await saveBudgetMonth(updated);
    },
    [userId, budgetMonth],
  );

  const updateRollover = useCallback(
    async (amount: number): Promise<void> => {
      if (!userId || !budgetMonth) throw new Error('Not authenticated');
      const updated: BudgetMonth = { ...budgetMonth, rollover: amount };
      await saveBudgetMonth(updated);
    },
    [userId, budgetMonth],
  );

  return {
    budgetMonth,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
    updateBudgetPeriod,
    updateRollover,
  };
}

// ─── Internal ────────────────────────────────────────────────────────────────

function recalcActuals(bm: BudgetMonth): void {
  const totals = new Map<string, number>();
  for (const t of bm.transactions ?? []) {
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  for (const cat of bm.categories ?? []) {
    cat.actual = totals.get(cat.id) ?? 0;
  }
}
