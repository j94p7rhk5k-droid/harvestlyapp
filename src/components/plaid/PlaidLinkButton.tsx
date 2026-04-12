'use client';

import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

// ─── Props ──────────────────────────────────────────────────────────────────

interface PlaidLinkButtonProps {
  userId: string;
  onSuccess?: (institutionName: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlaidLinkButton({
  userId,
  onSuccess,
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedName, setConnectedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ── Create link token ─────────────────────────────────────────────────

  const createLinkToken = useCallback(async () => {
    setCreatingToken(true);
    setError(null);

    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create link token');
      }

      const data = await res.json();
      setLinkToken(data.link_token);
    } catch (err: any) {
      console.error('[PlaidLink] token error:', err);
      setError(err.message || 'Could not connect to Plaid');
    } finally {
      setCreatingToken(false);
    }
  }, [userId]);

  // ── Plaid Link callbacks ──────────────────────────────────────────────

  const handlePlaidSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      setExchanging(true);
      setError(null);

      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken, userId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to exchange token');
        }

        const data = await res.json();
        const institutionName =
          data.institutionName ||
          metadata?.institution?.name ||
          'Bank Account';

        setConnected(true);
        setConnectedName(institutionName);
        onSuccess?.(institutionName);

        // Reset success state after a few seconds
        setTimeout(() => {
          setConnected(false);
          setConnectedName('');
          setLinkToken(null);
        }, 3000);
      } catch (err: any) {
        console.error('[PlaidLink] exchange error:', err);
        setError(err.message || 'Failed to link account');
      } finally {
        setExchanging(false);
      }
    },
    [userId, onSuccess],
  );

  const handlePlaidExit = useCallback(() => {
    // User closed Plaid Link without completing — reset token
    setLinkToken(null);
  }, []);

  // ── usePlaidLink hook ─────────────────────────────────────────────────

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  // ── Click handler ─────────────────────────────────────────────────────

  const handleClick = async () => {
    if (linkToken && ready) {
      open();
    } else {
      await createLinkToken();
    }
  };

  // After token is created, automatically open Plaid Link
  // (usePlaidLink needs token on re-render, so we open on next interaction)
  // We handle this by checking if linkToken is set but not yet opened
  const shouldAutoOpen = linkToken && ready && !exchanging && !connected;

  // ── Render ────────────────────────────────────────────────────────────

  if (connected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">
          Connected to {connectedName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="primary"
        size="md"
        iconLeft={<Landmark className="w-4 h-4" />}
        loading={creatingToken || exchanging}
        onClick={shouldAutoOpen ? () => open() : handleClick}
        disabled={exchanging}
      >
        {creatingToken
          ? 'Connecting...'
          : exchanging
            ? 'Linking Account...'
            : 'Connect Bank Account'}
      </Button>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
