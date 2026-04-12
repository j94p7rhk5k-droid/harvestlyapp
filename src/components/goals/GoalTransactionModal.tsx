'use client';

import { useState, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NewGoalTransaction, GoalType } from '@/types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface GoalTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: NewGoalTransaction) => Promise<void>;
  goalId: string;
  goalType: GoalType;
  goalName: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GoalTransactionModal({
  open,
  onClose,
  onSave,
  goalId,
  goalType,
  goalName,
}: GoalTransactionModalProps) {
  const [saving, setSaving] = useState(false);
  const [isPositive, setIsPositive] = useState(true);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const positiveLabel = goalType === 'savings' ? 'Deposit' : 'Payment';
  const negativeLabel = goalType === 'savings' ? 'Withdrawal' : 'New Charge';

  const resetForm = useCallback(() => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsPositive(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setSaving(true);
    try {
      const tx: NewGoalTransaction = {
        goalId,
        goalType,
        amount: isPositive ? Math.abs(parseFloat(amount)) : -Math.abs(parseFloat(amount)),
        date,
        note: note.trim() || undefined,
      };
      await onSave(tx);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to save goal transaction:', err);
    } finally {
      setSaving(false);
    }
  }, [amount, isPositive, date, note, goalId, goalType, onSave, onClose, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Transaction"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Save
          </Button>
        </>
      }
    >
      {/* Goal indicator */}
      <div className="rounded-xl bg-navy-800/40 border border-navy-700/50 p-3 mb-5">
        <p className="text-xs text-navy-400 mb-0.5">For goal</p>
        <p className="text-sm font-semibold text-white">{goalName}</p>
      </div>

      {/* Transaction type toggle */}
      <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl mb-5">
        <button
          onClick={() => setIsPositive(true)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            isPositive
              ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-navy-400 hover:text-white',
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          {positiveLabel}
        </button>
        <button
          onClick={() => setIsPositive(false)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            !isPositive
              ? 'bg-red-500/20 text-red-300 shadow-sm'
              : 'text-navy-400 hover:text-white',
          )}
        >
          <ArrowDownRight className="w-4 h-4" />
          {negativeLabel}
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <Input
          label="Amount"
          type="number"
          placeholder="100.00"
          prefix="$"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          step={0.01}
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label="Note (Optional)"
          placeholder="e.g. Monthly contribution"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}
