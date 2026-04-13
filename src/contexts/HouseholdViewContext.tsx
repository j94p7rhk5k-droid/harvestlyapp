'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ViewMode = 'personal' | 'household';

interface HouseholdViewContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isHouseholdView: boolean;
  isInHousehold: boolean;
  partnerUserId: string | undefined;
}

const HouseholdViewContext = createContext<HouseholdViewContextValue | undefined>(undefined);

export function HouseholdViewProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('personal');

  const isInHousehold = !!(
    userProfile?.householdOwnerId || userProfile?.householdPartnerId
  );

  const partnerUserId = useMemo(
    () => userProfile?.householdOwnerId ?? userProfile?.householdPartnerId ?? undefined,
    [userProfile?.householdOwnerId, userProfile?.householdPartnerId],
  );

  // Force personal view if not in a household
  const effectiveViewMode = isInHousehold ? viewMode : 'personal';

  return (
    <HouseholdViewContext.Provider
      value={{
        viewMode: effectiveViewMode,
        setViewMode,
        isHouseholdView: effectiveViewMode === 'household',
        isInHousehold,
        partnerUserId,
      }}
    >
      {children}
    </HouseholdViewContext.Provider>
  );
}

export function useHouseholdView(): HouseholdViewContextValue {
  const ctx = useContext(HouseholdViewContext);
  if (ctx === undefined) {
    throw new Error('useHouseholdView must be used within a <HouseholdViewProvider>');
  }
  return ctx;
}
