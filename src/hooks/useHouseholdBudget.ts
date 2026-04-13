'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholdView } from '@/contexts/HouseholdViewContext';
import { useMonth } from '@/contexts/MonthContext';
import { useBudget } from './useBudget';
import { mergeBudgetMonths } from '@/lib/budget-merge';

export function useHouseholdBudget() {
  const { effectiveUserId } = useAuth();
  const { currentMonth } = useMonth();
  const { viewMode, partnerUserId, isHouseholdView } = useHouseholdView();

  // Always fetch own budget
  const myBudget = useBudget(effectiveUserId, currentMonth);

  // Fetch partner's budget only in household view
  const partnerBudget = useBudget(
    isHouseholdView ? partnerUserId : undefined,
    currentMonth,
  );

  // Merged data for display
  const budgetMonth = useMemo(() => {
    if (!isHouseholdView) return myBudget.budgetMonth;
    return mergeBudgetMonths(myBudget.budgetMonth, partnerBudget.budgetMonth);
  }, [isHouseholdView, myBudget.budgetMonth, partnerBudget.budgetMonth]);

  const loading = myBudget.loading || (isHouseholdView && partnerBudget.loading);

  return {
    // Display data (personal or merged)
    budgetMonth,
    loading,

    // Mutations always write to own budget
    addCategory: myBudget.addCategory,
    updateCategory: myBudget.updateCategory,
    deleteCategory: myBudget.deleteCategory,
    addTransaction: myBudget.addTransaction,
    deleteTransaction: myBudget.deleteTransaction,
    updateBudgetPeriod: myBudget.updateBudgetPeriod,
    updateRollover: myBudget.updateRollover,

    // View mode info
    isHouseholdView,
  };
}
