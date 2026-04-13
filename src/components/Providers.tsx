'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { MonthProvider } from '@/contexts/MonthContext';
import { HouseholdViewProvider } from '@/contexts/HouseholdViewContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HouseholdViewProvider>
        <MonthProvider>{children}</MonthProvider>
      </HouseholdViewProvider>
    </AuthProvider>
  );
}
