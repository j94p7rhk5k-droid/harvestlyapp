'use client';

import { useState, useCallback, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Category, NewTransaction, CategoryType } from '@/types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: NewTransaction) => Promise<void>;
  categories: Category[];
  preselectedCategoryId?: string;
  currency: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AddTransactionModal({
  open,
  onClose,
  onSave,
  categories,
  preselectedCategoryId,
  currency,
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(preselectedCategoryId ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update preselected when prop changes
  useEffect(() => {
    if (preselectedCategoryId) {
      setCategoryId(preselectedCategoryId);
    }
  }, [preselectedCategoryId]);

  const resetForm = useCallback(() => {
    setAmount('');
    setCategoryId(preselectedCategoryId ?? '');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsRecurring(false);
    setError('');
  }, [preselectedCategoryId]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      setError('Selected category not found');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        categoryId,
        categoryName: category.name,
        type: category.type,
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
        isRecurring,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to add transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.type})`,
  }));

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Transaction"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            Add Transaction
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          prefix={currency}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          step={0.01}
          autoFocus
          error={error && !amount ? error : undefined}
        />

        {/* Category selector */}
        <Select
          label="Category"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Select a category..."
          error={error && !categoryId ? error : undefined}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Note */}
        <Input
          label="Note (optional)"
          placeholder="Coffee, grocery run, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Recurring toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-300">Recurring</p>
            <p className="text-xs text-navy-500">Marks this as a recurring transaction</p>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              isRecurring ? 'bg-brand-500' : 'bg-navy-700',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                isRecurring ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        {/* Error message */}
        {error && amount && categoryId && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </Modal>
  );
}
