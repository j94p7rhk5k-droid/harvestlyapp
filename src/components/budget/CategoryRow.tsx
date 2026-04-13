'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronDown,
  Check,
  X,
  Pencil,
  Banknote,
  Laptop,
  TrendingUp,
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
  type LucideIcon,
} from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Category, Transaction, CategoryType } from '@/types';

// ─── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
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
};

// ─── Section colors ─────────────────────────────────────────────────────────

const SECTION_COLORS: Record<CategoryType, { icon: string; progressBar: string }> = {
  income: { icon: 'text-emerald-400 bg-emerald-500/10', progressBar: 'bg-emerald-500' },
  expense: { icon: 'text-rose-400 bg-rose-500/10', progressBar: 'bg-rose-500' },
  bill: { icon: 'text-blue-400 bg-blue-500/10', progressBar: 'bg-blue-500' },
  savings: { icon: 'text-violet-400 bg-violet-500/10', progressBar: 'bg-violet-500' },
  debt: { icon: 'text-amber-400 bg-amber-500/10', progressBar: 'bg-amber-500' },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  transactions: Transaction[];
  currency: string;
  onUpdate: (id: string, updates: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddTransaction: (categoryId: string) => void;
  onDeleteTransaction?: (transactionId: string) => Promise<void>;
  onEditTransaction?: (transaction: Transaction) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CategoryRow({
  category,
  transactions,
  currency,
  onUpdate,
  onDelete,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
}: CategoryRowProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(category.name);
  const [plannedValue, setPlannedValue] = useState(category.planned.toString());
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const colors = SECTION_COLORS[category.type];
  const IconComponent = ICON_MAP[category.icon ?? ''] ?? CircleDot;

  // Sync planned value if it changes externally
  useEffect(() => {
    setPlannedValue(category.planned.toString());
  }, [category.planned]);

  useEffect(() => {
    setNameValue(category.name);
  }, [category.name]);

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // Progress calculation
  const progress = category.planned > 0
    ? Math.round((category.actual / category.planned) * 100)
    : 0;

  // Category transactions (recent 5)
  const categoryTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.categoryId === category.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions, category.id],
  );

  // ── Inline edit handlers ────────────────────────────────────────────────

  const saveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== category.name) {
      await onUpdate(category.id, { name: trimmed });
    } else {
      setNameValue(category.name);
    }
    setEditingName(false);
  }, [nameValue, category.name, category.id, onUpdate]);

  const savePlanned = useCallback(async () => {
    const parsed = parseFloat(plannedValue);
    if (!isNaN(parsed) && parsed !== category.planned) {
      await onUpdate(category.id, { planned: parsed });
    } else {
      setPlannedValue(category.planned.toString());
    }
  }, [plannedValue, category.planned, category.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await onDelete(category.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [category.id, onDelete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl bg-navy-800/30 border border-navy-800/50 hover:border-navy-700/60 transition-all duration-200"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3 md:p-4">
        {/* Icon */}
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colors.icon)}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Name (inline editable) */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') {
                    setNameValue(category.name);
                    setEditingName(false);
                  }
                }}
                className="bg-navy-800/60 border border-navy-600 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-brand-500/50 w-full max-w-[180px]"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium text-white hover:text-brand-400 transition-colors text-left truncate block max-w-full"
              title="Click to edit name"
            >
              {category.name}
            </button>
          )}
        </div>

        {/* Planned amount (editable) */}
        <div className="flex-shrink-0 w-[100px]">
          <input
            type="number"
            value={plannedValue}
            onChange={(e) => setPlannedValue(e.target.value)}
            onBlur={savePlanned}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-full bg-transparent border border-transparent hover:border-navy-700 focus:border-brand-500/50 rounded-lg px-2 py-1 text-sm text-navy-300 text-right outline-none transition-colors tabular-nums"
            title="Planned amount"
            min={0}
            step={0.01}
          />
          <p className="text-[10px] text-navy-500 text-right mt-0.5">Planned</p>
        </div>

        {/* Actual amount */}
        <div className="flex-shrink-0 w-[90px] text-right">
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(category.actual, currency)}
          </p>
          <p className="text-[10px] text-navy-500 mt-0.5">Actual</p>
        </div>

        {/* Progress bar (compact) */}
        <div className="hidden md:block flex-shrink-0 w-[100px]">
          <ProgressBar
            value={progress}
            color={colors.progressBar}
            variant="thin"
            showPercentage
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Add transaction */}
          <button
            onClick={() => onAddTransaction(category.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-navy-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
            title="Add transaction"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Expand transactions */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-navy-400 hover:text-white hover:bg-navy-700/50 transition-all"
            title="Show transactions"
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all"
                title="Confirm delete"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-navy-400 hover:text-white hover:bg-navy-700/50 transition-all"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="md:hidden px-4 pb-3">
        <ProgressBar
          value={progress}
          color={colors.progressBar}
          variant="thin"
          showPercentage
        />
      </div>

      {/* Expanded: recent transactions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-navy-800/50 px-4 py-3">
              {categoryTransactions.length === 0 ? (
                <p className="text-xs text-navy-500 text-center py-2">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {categoryTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-navy-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-navy-500 flex-shrink-0 tabular-nums">
                          {formatDate(t.date)}
                        </span>
                        {t.note && (
                          <span className="text-navy-400 truncate">{t.note}</span>
                        )}
                        {t.isRecurring && (
                          <Repeat className="w-3 h-3 text-navy-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white tabular-nums flex-shrink-0">
                          {formatCurrency(t.amount, currency)}
                        </span>
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1 rounded-md text-navy-600 hover:text-brand-400 hover:bg-navy-800/50 opacity-0 group-hover:opacity-100 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1 rounded-md text-navy-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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
