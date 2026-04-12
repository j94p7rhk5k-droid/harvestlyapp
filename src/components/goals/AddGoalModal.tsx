'use client';

import { useState, useCallback } from 'react';
import { Target, Landmark } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NewSavingsGoal, NewDebtGoal, DebtType, SavingsGoal, DebtGoal } from '@/types';

// ─── Debt type options ──────────────────────────────────────────────────────

const DEBT_TYPE_OPTIONS = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car loan', label: 'Car Loan' },
  { value: 'student loan', label: 'Student Loan' },
  { value: 'credit card', label: 'Credit Card' },
  { value: 'personal loan', label: 'Personal Loan' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSavings: (goal: NewSavingsGoal) => Promise<void>;
  onSaveDebt: (goal: NewDebtGoal) => Promise<void>;
  onUpdateSavings?: (goal: SavingsGoal) => Promise<void>;
  onUpdateDebt?: (goal: DebtGoal) => Promise<void>;
  userId: string;
  defaultTab?: 'savings' | 'debt';
  editingSavingsGoal?: SavingsGoal | null;
  editingDebtGoal?: DebtGoal | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AddGoalModal({
  open,
  onClose,
  onSaveSavings,
  onSaveDebt,
  onUpdateSavings,
  onUpdateDebt,
  userId,
  defaultTab = 'savings',
  editingSavingsGoal,
  editingDebtGoal,
}: AddGoalModalProps) {
  const isEditMode = !!(editingSavingsGoal || editingDebtGoal);
  const initialTab = editingDebtGoal ? 'debt' : editingSavingsGoal ? 'savings' : defaultTab;

  const [activeTab, setActiveTab] = useState<'savings' | 'debt'>(initialTab);
  const [saving, setSaving] = useState(false);

  // Savings form
  const [fundName, setFundName] = useState(editingSavingsGoal?.fundName ?? '');
  const [goalDate, setGoalDate] = useState(editingSavingsGoal?.goalDate ?? '');
  const [goalAmount, setGoalAmount] = useState(
    editingSavingsGoal ? editingSavingsGoal.goalAmount.toString() : '',
  );
  const [startAmount, setStartAmount] = useState(
    editingSavingsGoal ? editingSavingsGoal.startAmount.toString() : '0',
  );

  // Debt form
  const [debtName, setDebtName] = useState(editingDebtGoal?.debtName ?? '');
  const [debtType, setDebtType] = useState<string>(editingDebtGoal?.debtType ?? 'credit card');
  const [debtGoalDate, setDebtGoalDate] = useState(editingDebtGoal?.goalDate ?? '');
  const [debtStartAmount, setDebtStartAmount] = useState(
    editingDebtGoal ? editingDebtGoal.startDebt.toString() : '',
  );

  // Reset when modal opens
  const resetForm = useCallback(() => {
    setFundName(editingSavingsGoal?.fundName ?? '');
    setGoalDate(editingSavingsGoal?.goalDate ?? '');
    setGoalAmount(editingSavingsGoal ? editingSavingsGoal.goalAmount.toString() : '');
    setStartAmount(editingSavingsGoal ? editingSavingsGoal.startAmount.toString() : '0');
    setDebtName(editingDebtGoal?.debtName ?? '');
    setDebtType(editingDebtGoal?.debtType ?? 'credit card');
    setDebtGoalDate(editingDebtGoal?.goalDate ?? '');
    setDebtStartAmount(editingDebtGoal ? editingDebtGoal.startDebt.toString() : '');
    setActiveTab(initialTab);
  }, [editingSavingsGoal, editingDebtGoal, initialTab]);

  // Handle save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (activeTab === 'savings') {
        if (!fundName.trim() || !goalAmount) return;

        if (isEditMode && editingSavingsGoal && onUpdateSavings) {
          const updated: SavingsGoal = {
            ...editingSavingsGoal,
            fundName: fundName.trim(),
            goalDate: goalDate || undefined,
            goalAmount: parseFloat(goalAmount),
            startAmount: parseFloat(startAmount) || 0,
            remaining: Math.max(
              0,
              parseFloat(goalAmount) -
                (parseFloat(startAmount) || 0) -
                editingSavingsGoal.saved,
            ),
            progress:
              parseFloat(goalAmount) > 0
                ? Math.min(
                    1,
                    ((parseFloat(startAmount) || 0) + editingSavingsGoal.saved) /
                      parseFloat(goalAmount),
                  )
                : 0,
          };
          await onUpdateSavings(updated);
        } else {
          const newGoal: NewSavingsGoal = {
            userId,
            fundName: fundName.trim(),
            goalDate: goalDate || undefined,
            goalAmount: parseFloat(goalAmount),
            startAmount: parseFloat(startAmount) || 0,
          };
          await onSaveSavings(newGoal);
        }
      } else {
        if (!debtName.trim() || !debtStartAmount) return;

        if (isEditMode && editingDebtGoal && onUpdateDebt) {
          const updated: DebtGoal = {
            ...editingDebtGoal,
            debtName: debtName.trim(),
            debtType: debtType as DebtType,
            goalDate: debtGoalDate || undefined,
            startDebt: parseFloat(debtStartAmount),
            remaining: Math.max(
              0,
              parseFloat(debtStartAmount) - editingDebtGoal.paidOff,
            ),
            progress:
              parseFloat(debtStartAmount) > 0
                ? Math.min(1, editingDebtGoal.paidOff / parseFloat(debtStartAmount))
                : 0,
          };
          await onUpdateDebt(updated);
        } else {
          const newGoal: NewDebtGoal = {
            userId,
            debtName: debtName.trim(),
            debtType: debtType as DebtType,
            goalDate: debtGoalDate || undefined,
            startDebt: parseFloat(debtStartAmount),
          };
          await onSaveDebt(newGoal);
        }
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setSaving(false);
    }
  }, [
    activeTab,
    fundName,
    goalDate,
    goalAmount,
    startAmount,
    debtName,
    debtType,
    debtGoalDate,
    debtStartAmount,
    userId,
    isEditMode,
    editingSavingsGoal,
    editingDebtGoal,
    onSaveSavings,
    onSaveDebt,
    onUpdateSavings,
    onUpdateDebt,
    onClose,
    resetForm,
  ]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const isSavingsValid = fundName.trim() && goalAmount && parseFloat(goalAmount) > 0;
  const isDebtValid = debtName.trim() && debtStartAmount && parseFloat(debtStartAmount) > 0;
  const isValid = activeTab === 'savings' ? isSavingsValid : isDebtValid;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? 'Edit Goal' : 'Add Goal'}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!isValid}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </>
      }
    >
      {/* Tab switcher */}
      {!isEditMode && (
        <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('savings')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'savings'
                ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                : 'text-navy-400 hover:text-white',
            )}
          >
            <Target className="w-4 h-4" />
            Savings
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'debt'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-navy-400 hover:text-white',
            )}
          >
            <Landmark className="w-4 h-4" />
            Debt
          </button>
        </div>
      )}

      {/* Savings form */}
      {activeTab === 'savings' && (
        <div className="space-y-4">
          <Input
            label="Fund Name"
            placeholder="e.g. Emergency Fund"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
          />
          <Input
            label="Goal Date (Optional)"
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
          />
          <Input
            label="Goal Amount"
            type="number"
            placeholder="10,000"
            prefix="$"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            min={0}
            step={0.01}
          />
          <Input
            label="Start Amount"
            type="number"
            placeholder="0"
            prefix="$"
            value={startAmount}
            onChange={(e) => setStartAmount(e.target.value)}
            min={0}
            step={0.01}
          />
        </div>
      )}

      {/* Debt form */}
      {activeTab === 'debt' && (
        <div className="space-y-4">
          <Input
            label="Debt Name"
            placeholder="e.g. Chase Sapphire"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
          />
          <Select
            label="Debt Type"
            options={DEBT_TYPE_OPTIONS}
            value={debtType}
            onChange={(e) => setDebtType(e.target.value)}
          />
          <Input
            label="Goal Date (Optional)"
            type="date"
            value={debtGoalDate}
            onChange={(e) => setDebtGoalDate(e.target.value)}
          />
          <Input
            label="Starting Debt Amount"
            type="number"
            placeholder="5,000"
            prefix="$"
            value={debtStartAmount}
            onChange={(e) => setDebtStartAmount(e.target.value)}
            min={0}
            step={0.01}
          />
        </div>
      )}
    </Modal>
  );
}
