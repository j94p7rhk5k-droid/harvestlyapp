'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholdView } from '@/contexts/HouseholdViewContext';
import { useGoals } from './useGoals';

export function useHouseholdGoals() {
  const { effectiveUserId } = useAuth();
  const { isHouseholdView, partnerUserId } = useHouseholdView();

  // Always fetch own goals
  const myGoals = useGoals(effectiveUserId);

  // Fetch partner's goals only in household view
  const partnerGoals = useGoals(isHouseholdView ? partnerUserId : undefined);

  const savingsGoals = useMemo(() => {
    if (!isHouseholdView) return myGoals.savingsGoals;
    return [...myGoals.savingsGoals, ...partnerGoals.savingsGoals];
  }, [isHouseholdView, myGoals.savingsGoals, partnerGoals.savingsGoals]);

  const debtGoals = useMemo(() => {
    if (!isHouseholdView) return myGoals.debtGoals;
    return [...myGoals.debtGoals, ...partnerGoals.debtGoals];
  }, [isHouseholdView, myGoals.debtGoals, partnerGoals.debtGoals]);

  const loading = myGoals.loading || (isHouseholdView && partnerGoals.loading);

  return {
    savingsGoals,
    debtGoals,
    loading,

    // Mutations always write to own goals
    addSavingsGoal: myGoals.addSavingsGoal,
    updateSavingsGoal: myGoals.updateSavingsGoal,
    deleteSavingsGoal: myGoals.deleteSavingsGoal,
    addDebtGoal: myGoals.addDebtGoal,
    updateDebtGoal: myGoals.updateDebtGoal,
    deleteDebtGoal: myGoals.deleteDebtGoal,
    addGoalTransaction: myGoals.addGoalTransaction,
    getGoalTransactions: myGoals.getGoalTransactions,

    isHouseholdView,
  };
}
