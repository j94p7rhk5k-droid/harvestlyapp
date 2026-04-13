'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { MonthProvider } from '@/contexts/MonthContext';
import { HouseholdViewProvider } from '@/contexts/HouseholdViewContext';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HouseholdViewProvider>
        <MonthProvider>
          <ChatProvider>{children}</ChatProvider>
        </MonthProvider>
      </HouseholdViewProvider>
    </AuthProvider>
  );
}
