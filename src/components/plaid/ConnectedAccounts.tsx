'use client';

import { useState } from 'react';
import {
  Landmark,
  RefreshCw,
  Trash2,
  CreditCard,
  Wallet,
  PiggyBank,
  AlertTriangle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PlaidLinkButton from './PlaidLinkButton';
import {
  usePlaidAccounts,
  type PlaidAccountInfo,
  type SyncResult,
} from '@/hooks/usePlaidAccounts';
import { formatCurrency } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ConnectedAccountsProps {
  userId: string;
  onSyncComplete?: (result: SyncResult, itemId: string) => void;
}

// ─── Account type icon helper ───────────────────────────────────────────────

function AccountIcon({ type }: { type: string }) {
  switch (type) {
    case 'credit':
      return <CreditCard className="w-4 h-4 text-navy-400" />;
    case 'depository':
      return <Wallet className="w-4 h-4 text-navy-400" />;
    case 'investment':
      return <PiggyBank className="w-4 h-4 text-navy-400" />;
    default:
      return <Wallet className="w-4 h-4 text-navy-400" />;
  }
}

// ─── Single Institution Card ────────────────────────────────────────────────

function InstitutionCard({
  item,
  onSync,
  onRemove,
}: {
  item: PlaidAccountInfo;
  onSync: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <Card noHover>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {item.institutionName || 'Connected Bank'}
            </h4>
            <p className="text-xs text-navy-400">
              {item.accounts.length} account
              {item.accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {item.error && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{item.error}</p>
        </div>
      )}

      {/* Accounts list */}
      {item.accounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {item.accounts.map((acct) => (
            <div
              key={acct.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-navy-800/40 border border-navy-800"
            >
              <div className="flex items-center gap-2.5">
                <AccountIcon type={acct.type} />
                <div>
                  <p className="text-sm text-white">{acct.name}</p>
                  <p className="text-xs text-navy-500">
                    {acct.subtype
                      ? acct.subtype.charAt(0).toUpperCase() +
                        acct.subtype.slice(1)
                      : acct.type}
                    {acct.mask ? ` ****${acct.mask}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white tabular-nums">
                  {formatCurrency(acct.balanceCurrent ?? 0)}
                </p>
                {acct.balanceAvailable !== null &&
                  acct.balanceAvailable !== acct.balanceCurrent && (
                    <p className="text-xs text-navy-500">
                      {formatCurrency(acct.balanceAvailable)} available
                    </p>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-navy-800">
        {!item.error && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => onSync(item.itemId)}
          >
            Sync Transactions
          </Button>
        )}

        {confirmRemove ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-navy-400">Are you sure?</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onRemove(item.itemId);
                setConfirmRemove(false);
              }}
            >
              Yes, disconnect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRemove(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setConfirmRemove(true)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            Disconnect
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ConnectedAccounts({
  userId,
  onSyncComplete,
}: ConnectedAccountsProps) {
  const { accounts, loading, error, refresh, syncTransactions, removeAccount } =
    usePlaidAccounts(userId);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // ── Sync handler ──────────────────────────────────────────────────────

  const handleSync = async (itemId: string) => {
    setSyncing(itemId);
    setSyncError(null);

    try {
      const result = await syncTransactions(itemId);
      onSyncComplete?.(result, itemId);
    } catch (err: any) {
      console.error('[ConnectedAccounts] sync error:', err);
      setSyncError(err.message || 'Failed to sync transactions');
    } finally {
      setSyncing(null);
    }
  };

  // ── Remove handler ────────────────────────────────────────────────────

  const handleRemove = async (itemId: string) => {
    setRemoving(itemId);

    try {
      await removeAccount(itemId);
    } catch (err: any) {
      console.error('[ConnectedAccounts] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-navy-900 border border-navy-800 p-5 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-navy-800" />
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-navy-800" />
                <div className="w-20 h-3 rounded bg-navy-800" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-xl bg-navy-800/40" />
              <div className="h-12 rounded-xl bg-navy-800/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (error) {
    return (
      <Card noHover>
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="mt-3">
          Try Again
        </Button>
      </Card>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<Landmark className="w-7 h-7" />}
        title="No banks connected"
        description="Connect your bank account to automatically import transactions and keep your budget up to date."
        action={
          <PlaidLinkButton
            userId={userId}
            onSuccess={() => refresh()}
          />
        }
      />
    );
  }

  // ── Connected accounts list ───────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Sync overlay */}
      {syncing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
          <span className="text-sm text-brand-400">
            Syncing transactions...
          </span>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{syncError}</span>
        </div>
      )}

      {removing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-navy-800 border border-navy-700">
          <RefreshCw className="w-4 h-4 text-navy-400 animate-spin" />
          <span className="text-sm text-navy-400">
            Disconnecting account...
          </span>
        </div>
      )}

      {accounts.map((item) => (
        <InstitutionCard
          key={item.itemId}
          item={item}
          onSync={handleSync}
          onRemove={handleRemove}
        />
      ))}

      {/* Add another bank */}
      <div className="pt-2">
        <PlaidLinkButton
          userId={userId}
          onSuccess={() => refresh()}
        />
      </div>
    </div>
  );
}
