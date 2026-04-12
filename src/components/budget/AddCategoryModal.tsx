'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Banknote,
  Laptop,
  TrendingUp,
  Plus,
  ShoppingCart,
  UtensilsCrossed,
  Bus,
  Fuel,
  ShoppingBag,
  Gamepad2,
  Heart,
  Sparkles,
  Home,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  Repeat,
  Shield,
  Dumbbell,
  Umbrella,
  Plane,
  PiggyBank,
  CreditCard,
  GraduationCap,
  Car,
  CircleDot,
  Music,
  Film,
  BookOpen,
  Coffee,
  Gift,
  Baby,
  Dog,
  Scissors,
  Shirt,
  Wrench,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { CategoryType, NewCategory } from '@/types';
import { cn } from '@/lib/utils';

// ─── Icon picker data ───────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { name: 'CircleDot', icon: CircleDot },
  { name: 'Banknote', icon: Banknote },
  { name: 'Laptop', icon: Laptop },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed },
  { name: 'Bus', icon: Bus },
  { name: 'Fuel', icon: Fuel },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Heart', icon: Heart },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Home', icon: Home },
  { name: 'Zap', icon: Zap },
  { name: 'Droplets', icon: Droplets },
  { name: 'Wifi', icon: Wifi },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Repeat', icon: Repeat },
  { name: 'Shield', icon: Shield },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Umbrella', icon: Umbrella },
  { name: 'Plane', icon: Plane },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Car', icon: Car },
  { name: 'Music', icon: Music },
  { name: 'Film', icon: Film },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gift', icon: Gift },
  { name: 'Baby', icon: Baby },
  { name: 'Dog', icon: Dog },
  { name: 'Scissors', icon: Scissors },
  { name: 'Shirt', icon: Shirt },
  { name: 'Wrench', icon: Wrench },
  { name: 'Plus', icon: Plus },
] as const;

// ─── Type labels ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Income',
  expense: 'Expense',
  bill: 'Bill',
  savings: 'Savings',
  debt: 'Debt',
};

const TYPE_COLORS: Record<CategoryType, string> = {
  income: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  expense: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  bill: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  savings: 'border-violet-500/40 bg-violet-500/10 text-violet-400',
  debt: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: NewCategory) => Promise<void>;
  defaultType: CategoryType;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AddCategoryModal({
  open,
  onClose,
  onSave,
  defaultType,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [planned, setPlanned] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('CircleDot');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens with new defaults
  const resetForm = useCallback(() => {
    setName('');
    setType(defaultType);
    setPlanned('');
    setSelectedIcon('CircleDot');
    setError('');
  }, [defaultType]);

  // Reset when modal opens or defaultType changes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        type,
        planned: parseFloat(planned) || 0,
        icon: selectedIcon,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to add category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Category"
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
            Add Category
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Category name */}
        <Input
          label="Category Name"
          placeholder="e.g. Groceries, Rent, Salary..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-navy-300 mb-1.5">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as CategoryType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200',
                  type === t
                    ? TYPE_COLORS[t]
                    : 'border-navy-700 bg-navy-800/40 text-navy-400 hover:text-navy-200 hover:border-navy-600',
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Planned amount */}
        <Input
          label="Planned Amount"
          type="number"
          prefix="$"
          placeholder="0.00"
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          min={0}
          step={0.01}
        />

        {/* Icon picker */}
        <div>
          <label className="block text-sm font-medium text-navy-300 mb-1.5">
            Icon
          </label>
          <div className="grid grid-cols-9 gap-1.5 max-h-[140px] overflow-y-auto p-1 rounded-xl bg-navy-800/30 border border-navy-700/50">
            {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
              <button
                key={iconName}
                onClick={() => setSelectedIcon(iconName)}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                  selectedIcon === iconName
                    ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/40'
                    : 'text-navy-400 hover:text-white hover:bg-navy-700/50',
                )}
                title={iconName}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
