'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlaidAccountInfo {
  itemId: string;
  institutionName: string;
  accounts: {
    id: string;
    name: string;
    type: string;
    subtype: string;
    balanceCurrent: number;
    balanceAvailable: number | null;
    mask: string;
  }[];
  error?: string;
}

export interface PlaidSyncedTransaction {
  plaidTransactionId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | undefined;
  category: string;
  detailedCategory: string | undefined;
  pending: boolean;
  accountId: string;
  isIncome: boolean;
}

export interface SyncResult {
  transactions: PlaidSyncedTransaction[];
  totalCount: number;
  accounts: {
    id: string;
    name: string;
    type: string;
    subtype: string;
    balanceCurrent: number;
    balanceAvailable: number | null;
    mask: string;
  }[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePlaidAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<PlaidAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch accounts ────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plaid/get-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch accounts');
      }

      const data = await res.json();
      setAccounts(data.accounts ?? []);
    } catch (err: any) {
      console.error('[usePlaidAccounts] fetch error:', err);
      setError(err.message || 'Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Sync transactions ─────────────────────────────────────────────────

  const syncTransactions = useCallback(
    async (
      itemId: string,
      startDate?: string,
      endDate?: string,
    ): Promise<SyncResult> => {
      if (!userId) throw new Error('Not authenticated');

      const res = await fetch('/api/plaid/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId, startDate, endDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync transactions');
      }

      return res.json();
    },
    [userId],
  );

  // ── Remove account ────────────────────────────────────────────────────

  const removeAccount = useCallback(
    async (itemId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');

      const res = await fetch('/api/plaid/remove-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove account');
      }

      // Refresh the accounts list
      await fetchAccounts();
    },
    [userId, fetchAccounts],
  );

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts,
    syncTransactions,
    removeAccount,
  };
}
