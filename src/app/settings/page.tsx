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
  Users,
  Mail,
  X,
  Check,
  LogOut,
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
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
  const household = useHousehold();
  const [currency, setCurrency] = useState(userProfile?.currency ?? '$');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    () => new Set(DEFAULT_CATEGORIES.map((c) => c.name)),
  );

  // ── Household handlers ────────────────────────────────────────────────
  const handleSendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await household.sendInvite(inviteEmail.trim());
      setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message ?? 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  }, [inviteEmail, household]);

  const handleLeaveHousehold = useCallback(async () => {
    try {
      await household.leaveHousehold();
      setLeaveModalOpen(false);
    } catch (err) {
      console.error('Failed to leave household:', err);
    }
  }, [household]);

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

          {/* ── Household Section ─────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card noHover>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Household</h2>
              </div>

              {/* Pending invites received */}
              {household.pendingInvites.length > 0 && (
                <div className="mb-5 space-y-2">
                  <p className="text-xs font-medium text-brand-400 uppercase tracking-wide mb-2">
                    Pending Invites
                  </p>
                  {household.pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {invite.fromDisplayName}
                        </p>
                        <p className="text-xs text-navy-400 truncate">
                          {invite.fromEmail} wants to share their budget with you
                        </p>
                      </div>
                      <button
                        onClick={() => household.acceptInvite(invite)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => household.declineInvite(invite)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Already in a household */}
              {household.isInHousehold ? (
                <div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/40 border border-navy-700">
                    {household.partnerProfile?.photoURL ? (
                      <img
                        src={household.partnerProfile.photoURL}
                        alt={household.partnerProfile.displayName}
                        className="w-10 h-10 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                        {household.partnerProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {household.partnerProfile?.displayName ?? 'Partner'}
                      </p>
                      <p className="text-xs text-navy-400 truncate">
                        {household.partnerProfile?.email}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-violet-500/10 text-violet-400">
                      {household.isOwner ? 'You are owner' : 'You are partner'}
                    </span>
                  </div>

                  <p className="text-xs text-navy-500 mt-3">
                    {household.isOwner
                      ? 'Your partner sees and edits the same budget data as you.'
                      : 'You are viewing and editing your partner\'s budget data.'}
                  </p>

                  <Button
                    variant="ghost"
                    className="mt-3 text-red-400 hover:text-red-300"
                    iconLeft={<LogOut className="w-4 h-4" />}
                    onClick={() => setLeaveModalOpen(true)}
                  >
                    Leave Household
                  </Button>
                </div>
              ) : (
                /* Not in a household — show invite form */
                <div>
                  <p className="text-xs text-navy-400 mb-4">
                    Share your budget with a partner. They'll be able to view and edit the same budget,
                    transactions, and goals — perfect for managing household finances together.
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Partner's email address"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setInviteError('');
                          setInviteSuccess('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                      />
                    </div>
                    <Button
                      onClick={handleSendInvite}
                      loading={inviteLoading}
                      iconLeft={<Mail className="w-4 h-4" />}
                    >
                      Invite
                    </Button>
                  </div>

                  {inviteError && (
                    <p className="text-xs text-red-400 mt-2">{inviteError}</p>
                  )}
                  {inviteSuccess && (
                    <p className="text-xs text-emerald-400 mt-2">{inviteSuccess}</p>
                  )}

                  {/* Sent invites */}
                  {household.sentInvites.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-navy-500 uppercase tracking-wide">
                        Sent Invites
                      </p>
                      {household.sentInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-800/30 border border-navy-800"
                        >
                          <Mail className="w-3.5 h-3.5 text-navy-500 flex-shrink-0" />
                          <span className="text-sm text-navy-300 flex-1 truncate">
                            {invite.toEmail}
                          </span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                          <button
                            onClick={() => household.cancelInvite(invite)}
                            className="p-1 rounded-lg text-navy-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Cancel invite"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

      {/* ── Leave Household Modal ────────────────────────────────────────── */}
      <Modal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Leave Household"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLeaveHousehold}>
              Yes, Leave Household
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Leave this household?
          </h3>
          <p className="text-sm text-navy-400 max-w-sm leading-relaxed">
            {household.isOwner
              ? 'Your partner will no longer be able to see or edit your budget data. No data will be deleted.'
              : 'You will return to your own budget data. The owner\'s data will remain unchanged.'}
          </p>
        </div>
      </Modal>

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
