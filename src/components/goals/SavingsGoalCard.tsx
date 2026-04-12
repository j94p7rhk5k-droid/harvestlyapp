'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  Target,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import ProgressRing from '@/components/charts/ProgressRing';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { SavingsGoal, GoalTransaction } from '@/types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  currency: string;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goalId: string) => void;
  onAddTransaction: (goalId: string) => void;
  getTransactions: (goalId: string) => Promise<GoalTransaction[]>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SavingsGoalCard({
  goal,
  currency,
  onEdit,
  onDelete,
  onAddTransaction,
  getTransactions,
}: SavingsGoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const totalSaved = goal.startAmount + goal.saved;
  const remaining = Math.max(0, goal.goalAmount - totalSaved);
  const progressPct = goal.goalAmount > 0 ? Math.min((totalSaved / goal.goalAmount) * 100, 100) : 0;

  // Fetch transactions when expanded
  useEffect(() => {
    if (expanded && transactions.length === 0) {
      setLoadingTx(true);
      getTransactions(goal.id)
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoadingTx(false));
    }
  }, [expanded, goal.id, getTransactions, transactions.length]);

  // Refetch when goal.saved changes (new transaction added)
  useEffect(() => {
    if (expanded) {
      getTransactions(goal.id)
        .then(setTransactions)
        .catch(console.error);
    }
  }, [goal.saved, expanded, goal.id, getTransactions]);

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden',
        'bg-navy-900 border-navy-800 shadow-card',
        'hover:shadow-card-hover hover:-translate-y-0.5',
      )}
    >
      {/* ── Card header ───────────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-white truncate">
                {goal.fundName}
              </h3>
            </div>
            {goal.goalDate ? (
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar className="w-3.5 h-3.5 text-navy-500" />
                <span className="text-xs text-navy-400">
                  Target: {formatDate(goal.goalDate)}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center text-xs text-navy-500 mt-2 px-2 py-0.5 rounded-full bg-navy-800/60">
                No deadline
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
              className="p-1.5 rounded-lg text-navy-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              title="Edit goal"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
              className="p-1.5 rounded-lg text-navy-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Progress ring + stats ─────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <ProgressRing
            percentage={progressPct}
            size={100}
            strokeWidth={8}
            centerValue={`${Math.round(progressPct)}%`}
            centerLabel="saved"
            color="#8b5cf6"
          />

          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-400">Goal</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatCurrency(goal.goalAmount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-400">Start</span>
              <span className="text-sm text-navy-300 tabular-nums">
                {formatCurrency(goal.startAmount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-400">Saved</span>
              <span className="text-sm font-semibold text-violet-400 tabular-nums">
                {formatCurrency(goal.saved, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-navy-800">
              <span className="text-xs text-navy-400">Remaining</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatCurrency(remaining, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Expand toggle ─────────────────────────────────────────────── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1.5 w-full mt-4 pt-3 border-t border-navy-800/50 text-xs text-navy-400 hover:text-violet-400 transition-colors"
        >
          <span>{expanded ? 'Hide' : 'View'} Transactions</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ── Expanded transactions ────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-navy-800/50">
              <div className="flex items-center justify-between mt-4 mb-3">
                <span className="text-xs font-medium text-navy-300">
                  Transaction History
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => onAddTransaction(goal.id)}
                >
                  Add
                </Button>
              </div>

              {loadingTx ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-xs text-navy-500 py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                  {transactions
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-navy-800/30 hover:bg-navy-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                            tx.amount >= 0
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400',
                          )}>
                            {tx.amount >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <Wallet className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-navy-300 truncate">
                              {tx.note || (tx.amount >= 0 ? 'Deposit' : 'Withdrawal')}
                            </p>
                            <p className="text-[10px] text-navy-500">
                              {formatDate(tx.date)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums flex-shrink-0 ml-2',
                            tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
