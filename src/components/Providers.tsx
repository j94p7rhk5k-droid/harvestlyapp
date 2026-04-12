'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { MonthProvider } from '@/contexts/MonthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MonthProvider>{children}</MonthProvider>
    </AuthProvider>
  );
}
