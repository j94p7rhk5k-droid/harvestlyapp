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

  const { isInHousehold } = useHouseholdView();

  // Always fetch partner's budget when in a household (needed for notifications)
  const partnerBudget = useBudget(
    isInHousehold ? partnerUserId : undefined,
    currentMonth,
  );

  // Merged data for display
  const budgetMonth = useMemo(() => {
    if (!isHouseholdView) return myBudget.budgetMonth;
    return mergeBudgetMonths(myBudget.budgetMonth, partnerBudget.budgetMonth);
  }, [isHouseholdView, myBudget.budgetMonth, partnerBudget.budgetMonth]);

  const loading = myBudget.loading || (isInHousehold && partnerBudget.loading);

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

    // Partner data (for notifications)
    partnerBudgetMonth: partnerBudget.budgetMonth,

    // View mode info
    isHouseholdView,
  };
}
