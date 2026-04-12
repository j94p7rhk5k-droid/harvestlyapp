'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Globe,
  Download,
  Trash2,
  Info,
  Sprout,
  Shield,
  AlertTriangle,
  Landmark,
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConnectedAccounts from '@/components/plaid/ConnectedAccounts';
import { cn } from '@/lib/utils';

// ─── Animation variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Currency options ───────────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { value: '$', label: '$ — US Dollar (USD)' },
  { value: '\u20AC', label: '\u20AC — Euro (EUR)' },
  { value: '\u00A3', label: '\u00A3 — British Pound (GBP)' },
  { value: '\u00A5', label: '\u00A5 — Japanese Yen (JPY)' },
  { value: 'C$', label: 'C$ — Canadian Dollar (CAD)' },
  { value: 'A$', label: 'A$ — Australian Dollar (AUD)' },
  { value: '\u20B9', label: '\u20B9 — Indian Rupee (INR)' },
  { value: 'R$', label: 'R$ — Brazilian Real (BRL)' },
  { value: 'CHF', label: 'CHF — Swiss Franc (CHF)' },
  { value: '\u20A9', label: '\u20A9 — South Korean Won (KRW)' },
  { value: 'MX$', label: 'MX$ — Mexican Peso (MXN)' },
];

// ─── Default categories ─────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Investments', type: 'income' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Dining Out', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Rent/Mortgage', type: 'bill' },
  { name: 'Electricity', type: 'bill' },
  { name: 'Internet', type: 'bill' },
  { name: 'Phone', type: 'bill' },
  { name: 'Insurance', type: 'bill' },
  { name: 'Subscriptions', type: 'bill' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  income: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  expense: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  bill: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  savings: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  debt: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

// ─── Main page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, userProfile, signOut } = useAuth();
  const [currency, setCurrency] = useState(userProfile?.currency ?? '$');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    () => new Set(DEFAULT_CATEGORIES.map((c) => c.name)),
  );

  // ── Currency handler ───────────────────────────────────────────────────
  const handleCurrencyChange = useCallback(
    async (newCurrency: string) => {
      if (!user) return;
      setCurrency(newCurrency);
      setSavingCurrency(true);
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await setDoc(
          doc(db, 'users', user.uid),
          { currency: newCurrency },
          { merge: true },
        );
      } catch (err) {
        console.error('Failed to update currency:', err);
      } finally {
        setSavingCurrency(false);
      }
    },
    [user],
  );

  // ── Category toggle ────────────────────────────────────────────────────
  const toggleCategory = useCallback((name: string) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // ── Export data placeholder ────────────────────────────────────────────
  const handleExport = useCallback(() => {
    // Placeholder — would export user data as JSON/CSV
    alert('Export feature coming soon! Your data will be downloadable as CSV.');
  }, []);

  // ── Delete account ─────────────────────────────────────────────────────
  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete Firestore user document
      await deleteDoc(doc(db, 'users', user.uid));
      // Delete Firebase auth account
      await deleteUser(user);
      // Sign out will happen automatically
    } catch (err: any) {
      // If requires recent auth, ask user to re-authenticate
      if (err?.code === 'auth/requires-recent-login') {
        alert('For security, please sign out, sign back in, and try again.');
      } else {
        console.error('Failed to delete account:', err);
      }
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }, [user]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-navy-400 mt-0.5">
            Manage your account and preferences
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── Profile Section ─────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Profile</h2>
              </div>

              <div className="flex items-center gap-4">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-16 h-16 rounded-2xl ring-2 ring-navy-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl font-bold text-white">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-white truncate">
                    {userProfile?.displayName ?? 'User'}
                  </p>
                  <p className="text-sm text-navy-400 truncate">
                    {userProfile?.email ?? ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield className="w-3 h-3 text-brand-500" />
                    <span className="text-xs text-navy-500">
                      Signed in with Google
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Currency Section ────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Currency</h2>
              </div>

              <div className="max-w-xs">
                <Select
                  label="Display Currency"
                  options={CURRENCY_OPTIONS}
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                />
                {savingCurrency && (
                  <p className="text-xs text-brand-400 mt-2 animate-pulse-soft">
                    Saving...
                  </p>
                )}
              </div>
              <p className="text-xs text-navy-500 mt-3">
                This symbol will be used to format all currency values across the app.
              </p>
            </Card>
          </motion.div>

          {/* ── Connected Bank Accounts ──────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  Connected Banks
                </h2>
              </div>

              <p className="text-xs text-navy-400 mb-4">
                Connect your bank accounts to automatically import transactions.
                Your credentials are handled securely by Plaid and never stored on our servers.
              </p>

              {user && <ConnectedAccounts userId={user.uid} />}
            </Card>
          </motion.div>

          {/* ── Default Categories Section ──────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  Default Categories
                </h2>
              </div>

              <p className="text-xs text-navy-400 mb-4">
                Choose which default categories appear when creating a new budget month.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const colors = TYPE_COLORS[cat.type] ?? TYPE_COLORS.expense;
                  const enabled = enabledCategories.has(cat.name);

                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left',
                        enabled
                          ? 'border-navy-700 bg-navy-800/40'
                          : 'border-navy-800/50 bg-navy-900/30 opacity-50',
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0 transition-colors',
                          enabled ? colors.text.replace('text-', 'bg-') : 'bg-navy-700',
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm flex-1',
                          enabled ? 'text-white' : 'text-navy-500',
                        )}
                      >
                        {cat.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full',
                          enabled ? `${colors.bg} ${colors.text}` : 'bg-navy-800 text-navy-600',
                        )}
                      >
                        {cat.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* ── Export Data Section ─────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Download className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Export Data</h2>
              </div>

              <p className="text-xs text-navy-400 mb-4">
                Download all your budget data as a file for backup or analysis.
              </p>

              <Button
                variant="secondary"
                iconLeft={<Download className="w-4 h-4" />}
                onClick={handleExport}
              >
                Export All Data
              </Button>
            </Card>
          </motion.div>

          {/* ── Danger Zone ────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover className="border-red-500/20">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
              </div>

              <p className="text-xs text-navy-400 mb-4">
                Permanently delete your account and all associated data. This action
                cannot be undone.
              </p>

              <Button
                variant="danger"
                iconLeft={<Trash2 className="w-4 h-4" />}
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </Card>
          </motion.div>

          {/* ── App Info ────────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center">
                  <Info className="w-4 h-4 text-navy-400" />
                </div>
                <h2 className="text-base font-semibold text-white">About</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy-400">App</span>
                  <span className="flex items-center gap-1.5 text-white font-medium">
                    <Sprout className="w-3.5 h-3.5 text-brand-500" />
                    Harvestly
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy-400">Version</span>
                  <span className="text-navy-300">1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy-400">Built with</span>
                  <span className="text-navy-300">Next.js + Firebase</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Delete Account Modal ──────────────────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting}>
              Yes, Delete My Account
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Are you absolutely sure?
          </h3>
          <p className="text-sm text-navy-400 max-w-sm leading-relaxed">
            This will permanently delete your account, all budget data, goals, and
            transactions. This action cannot be reversed.
          </p>
        </div>
      </Modal>
    </AppLayout>
  );
}
