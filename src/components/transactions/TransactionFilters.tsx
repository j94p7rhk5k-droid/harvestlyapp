'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { CategoryType } from '@/types';

// ─── Filter types ───────────────────────────────────────────────────────────

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface FilterState {
  search: string;
  type: CategoryType | 'all';
  dateFrom: string;
  dateTo: string;
  sort: SortOption;
}

// ─── Type pill config ───────────────────────────────────────────────────────

const TYPE_PILLS: { value: CategoryType | 'all'; label: string; activeClass: string }[] = [
  { value: 'all', label: 'All', activeClass: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
  { value: 'income', label: 'Income', activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'expense', label: 'Expenses', activeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'bill', label: 'Bills', activeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'savings', label: 'Savings', activeClass: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'debt', label: 'Debt', activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest amount' },
  { value: 'lowest', label: 'Lowest amount' },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalResults: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TransactionFilters({
  filters,
  onChange,
  totalResults,
}: TransactionFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by note or category..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            iconRight={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 h-full">
            <div className="flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-800/60 px-3 py-2.5">
              <ArrowUpDown className="w-4 h-4 text-navy-400 flex-shrink-0" />
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
                className="bg-transparent text-sm text-white outline-none cursor-pointer appearance-none pr-4"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-navy-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => updateFilter('type', pill.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
              filters.type === pill.value
                ? pill.activeClass
                : 'border-navy-700/50 text-navy-400 hover:text-white hover:border-navy-600 bg-navy-800/30',
            )}
          >
            {pill.label}
          </button>
        ))}

        <span className="text-xs text-navy-500 ml-auto">
          {totalResults} transaction{totalResults !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-400">From</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="bg-navy-800/60 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-400">To</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="bg-navy-800/60 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
        {(filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
            className="text-xs text-navy-500 hover:text-navy-300 transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
