'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useBudget } from '@/hooks/useBudget';
import { useHousehold } from '@/hooks/useHousehold';
import Sidebar from './Sidebar';
import Header from './Header';
import AddTransactionModal from '@/components/budget/AddTransactionModal';
import type { NewTransaction } from '@/types';

// ─── Loading spinner ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-navy-950 flex flex-col items-center justify-center gap-4 z-50">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-navy-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin-slow" />
      </div>
      <p className="text-sm text-navy-400 animate-pulse-soft">Loading...</p>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, userProfile, effectiveUserId } = useAuth();
  const { currentMonth } = useMonth();
  const { budgetMonth, addTransaction } = useBudget(effectiveUserId, currentMonth);
  const { pendingInvites } = useHousehold();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleSaveTransaction = useCallback(async (tx: NewTransaction) => {
    await addTransaction(tx);
  }, [addTransaction]);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show loading while auth is resolving
  if (loading) return <LoadingScreen />;

  // Don't render the layout at all if not authed (redirect will happen)
  if (!user) return <LoadingScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onAddTransaction={() => setAddModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
            {/* Pending household invite banner */}
            {pendingInvites.length > 0 && (
              <Link
                href="/settings"
                className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors"
              >
                <Users className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <p className="text-sm text-violet-300">
                  <span className="font-medium">{pendingInvites[0].fromDisplayName}</span>{' '}
                  invited you to share their budget.{' '}
                  <span className="underline">View invite →</span>
                </p>
              </Link>
            )}
            {children}
          </div>
        </main>
      </div>

      <AddTransactionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={budgetMonth?.categories ?? []}
        currency={userProfile?.currency ?? '$'}
      />
    </div>
  );
}
