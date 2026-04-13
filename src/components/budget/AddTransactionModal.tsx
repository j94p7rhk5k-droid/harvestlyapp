'use client';

import { useState, useCallback, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Category, NewTransaction, CategoryType, RecurrenceFrequency } from '@/types';

const TYPE_OPTIONS: { value: CategoryType; label: string; icon: string }[] = [
  { value: 'income', label: 'Income', icon: '💰' },
  { value: 'expense', label: 'Expense', icon: '🛒' },
  { value: 'bill', label: 'Bill', icon: '📄' },
  { value: 'savings', label: 'Savings', icon: '🐷' },
  { value: 'debt', label: 'Debt', icon: '💳' },
];

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
  const [selectedType, setSelectedType] = useState<CategoryType | ''>('');
  const [categoryId, setCategoryId] = useState(preselectedCategoryId ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update preselected when prop changes
  useEffect(() => {
    if (preselectedCategoryId) {
      setCategoryId(preselectedCategoryId);
      const cat = categories.find((c) => c.id === preselectedCategoryId);
      if (cat) setSelectedType(cat.type);
    }
  }, [preselectedCategoryId, categories]);

  const resetForm = useCallback(() => {
    setAmount('');
    setSelectedType('');
    setCategoryId(preselectedCategoryId ?? '');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsRecurring(false);
    setRecurrenceFrequency('monthly');
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
        note: note.trim() || '',
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to add transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = selectedType
    ? categories.filter((c) => c.type === selectedType)
    : [];

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
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
          <Button size="sm" onClick={handleSave} loading={saving} disabled={saving}>
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

        {/* Step 1: Type selector */}
        <div>
          <label className="block text-sm font-medium text-navy-300 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const count = categories.filter((c) => c.type === opt.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.value);
                    setCategoryId('');
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                    selectedType === opt.value
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-400'
                      : 'bg-navy-800/30 border-navy-700 text-navy-400 hover:text-navy-300 hover:border-navy-600',
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span className="text-navy-500 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Category dropdown (filtered by type) */}
        {selectedType && (
          <Select
            label="Category"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder={`Select ${selectedType} category...`}
            error={error && !categoryId ? error : undefined}
          />
        )}

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
        <div className="space-y-3">
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

          {/* Frequency selector — shown when recurring is on */}
          {isRecurring && (
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ] as { value: RecurrenceFrequency; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrenceFrequency(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    recurrenceFrequency === opt.value
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-400'
                      : 'bg-navy-800/30 border-navy-700 text-navy-400 hover:text-navy-300 hover:border-navy-600',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && amount && categoryId && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </Modal>
  );
}
