'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Plus,
  DollarSign,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import CategoryRow from './CategoryRow';
import { formatCurrency, cn } from '@/lib/utils';
import type { Category, Transaction, CategoryType } from '@/types';

// ─── Section config ─────────────────────────────────────────────────────────

interface SectionConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  headerGlow: string;
}

const SECTION_CONFIG: Record<CategoryType, SectionConfig> = {
  income: {
    icon: DollarSign,
    label: 'Income',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    headerGlow: 'shadow-[0_0_20px_rgba(52,211,153,0.05)]',
  },
  expense: {
    icon: ShoppingCart,
    label: 'Expenses',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    headerGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.05)]',
  },
  bill: {
    icon: Receipt,
    label: 'Bills',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    headerGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)]',
  },
  savings: {
    icon: PiggyBank,
    label: 'Savings',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    headerGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.05)]',
  },
  debt: {
    icon: Landmark,
    label: 'Debt',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    headerGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.05)]',
  },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BudgetSectionProps {
  type: CategoryType;
  categories: Category[];
  transactions: Transaction[];
  currency: string;
  onAddCategory: () => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddTransaction: (categoryId: string) => void;
  onDeleteTransaction?: (transactionId: string) => Promise<void>;
  onEditTransaction?: (transaction: Transaction) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BudgetSection({
  type,
  categories,
  transactions,
  currency,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
}: BudgetSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const config = SECTION_CONFIG[type];
  const Icon = config.icon;

  // Calculate totals
  const totalPlanned = categories.reduce((sum, c) => sum + c.planned, 0);
  const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-card">
      {/* ── Section Header ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition-all duration-200',
          'hover:bg-navy-800/30',
          config.headerGlow,
        )}
      >
        <div className="flex items-center gap-3">
          {/* Section icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              config.bgColor,
              config.color,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* Title + count */}
          <div className="text-left">
            <h3 className={cn('text-base font-semibold', config.color)}>
              {config.label}
            </h3>
            <p className="text-xs text-navy-500">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>
        </div>

        {/* Totals + chevron */}
        <div className="flex items-center gap-4">
          {/* Totals */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-navy-500 uppercase tracking-wider">Planned</p>
                <p className="text-sm font-semibold text-navy-300 tabular-nums">
                  {formatCurrency(totalPlanned, currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-navy-500 uppercase tracking-wider">Actual</p>
                <p className="text-sm font-semibold text-white tabular-nums">
                  {formatCurrency(totalActual, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-navy-500 transition-transform duration-300',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Mobile totals (visible when collapsed too) */}
      <div className="sm:hidden px-5 pb-3 flex items-center gap-4">
        <div>
          <p className="text-[10px] text-navy-500 uppercase tracking-wider">Planned</p>
          <p className="text-sm font-semibold text-navy-300 tabular-nums">
            {formatCurrency(totalPlanned, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-navy-500 uppercase tracking-wider">Actual</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatCurrency(totalActual, currency)}
          </p>
        </div>
      </div>

      {/* ── Collapsible body ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-navy-800/60">
              {/* Category rows */}
              {categories.length > 0 ? (
                <div className="p-3 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {categories.map((cat) => (
                      <CategoryRow
                        key={cat.id}
                        category={cat}
                        transactions={transactions}
                        currency={currency}
                        onUpdate={onUpdateCategory}
                        onDelete={onDeleteCategory}
                        onAddTransaction={onAddTransaction}
                        onDeleteTransaction={onDeleteTransaction}
                        onEditTransaction={onEditTransaction}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-navy-500 mb-3">
                    No {config.label.toLowerCase()} categories yet
                  </p>
                </div>
              )}

              {/* Section footer: Add category + totals */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-navy-800/40 bg-navy-800/10">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                  onClick={onAddCategory}
                >
                  Add Category
                </Button>

                {/* Total row */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-navy-500 uppercase tracking-wider">
                        Total Planned
                      </p>
                      <p className={cn('text-sm font-bold tabular-nums', config.color)}>
                        {formatCurrency(totalPlanned, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-navy-500 uppercase tracking-wider">
                        Total Actual
                      </p>
                      <p className="text-sm font-bold text-white tabular-nums">
                        {formatCurrency(totalActual, currency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
