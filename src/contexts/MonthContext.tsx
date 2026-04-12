'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getCurrentMonth } from '@/lib/utils';

// ─── Context shape ───────────────────────────────────────────────────────────

interface MonthContextValue {
  /** Current month in "YYYY-MM" format, e.g. "2026-04" */
  currentMonth: string;
  /** Set month directly */
  setMonth: (month: string) => void;
  /** Navigate to the next month */
  nextMonth: () => void;
  /** Navigate to the previous month */
  prevMonth: () => void;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

// ─── Helpers ────────────────────────────────────────────────────────────────

function shiftMonth(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function MonthProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);

  const setMonth = useCallback((month: string) => {
    setCurrentMonth(month);
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((prev) => shiftMonth(prev, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentMonth((prev) => shiftMonth(prev, -1));
  }, []);

  return (
    <MonthContext.Provider value={{ currentMonth, setMonth, nextMonth, prevMonth }}>
      {children}
    </MonthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext);
  if (ctx === undefined) {
    throw new Error('useMonth must be used within a <MonthProvider>');
  }
  return ctx;
}
