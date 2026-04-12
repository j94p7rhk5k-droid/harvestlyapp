import { clsx, type ClassValue } from 'clsx';
import type { CategoryType } from '@/types';

// ─── Class names ─────────────────────────────────────────────────────────────

/**
 * Merge class names — thin wrapper around `clsx`.
 * If you later add tailwind-merge, swap the implementation here.
 */
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}

// ─── Currency / formatting ───────────────────────────────────────────────────

/**
 * Format a number as a currency string.
 * @example formatCurrency(1234.5, "$") => "$1,234.50"
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${currency}${formatted}` : `${currency}${formatted}`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string into a human-readable form.
 * @example formatDate("2025-06-15") => "Jun 15, 2025"
 */
export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00'); // force local timezone
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get the current month in "YYYY-MM" format.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Convert "2025-06" into "June 2025".
 */
export function getMonthName(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── Progress helpers ────────────────────────────────────────────────────────

/**
 * Calculate progress as a 0-1 ratio (clamped).
 */
export function calculateProgress(actual: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.min(actual / planned, 1);
}

/**
 * Return a Tailwind-friendly colour string based on budget progress.
 *  - Under 80 %  → green
 *  - 80 – 99 %   → yellow / amber
 *  - 100 %+       → red
 */
export function getProgressColor(progress: number): string {
  if (progress >= 1) return 'text-red-500';
  if (progress >= 0.8) return 'text-amber-500';
  return 'text-emerald-500';
}

/**
 * Same as getProgressColor but for bg- classes (progress bars, badges, etc.).
 */
export function getProgressBgColor(progress: number): string {
  if (progress >= 1) return 'bg-red-500';
  if (progress >= 0.8) return 'bg-amber-500';
  return 'bg-emerald-500';
}

// ─── Category visuals ────────────────────────────────────────────────────────

const TYPE_COLORS: Record<CategoryType, string> = {
  income: '#22c55e',    // green-500
  expense: '#f97316',   // orange-500
  bill: '#6366f1',      // indigo-500
  savings: '#3b82f6',   // blue-500
  debt: '#ef4444',      // red-500
};

export function getCategoryColor(type: CategoryType): string {
  return TYPE_COLORS[type] ?? '#94a3b8'; // slate-400 fallback
}

/**
 * Suggest a Lucide icon name for well-known category names.
 */
const ICON_MAP: Record<string, string> = {
  salary: 'Banknote',
  freelance: 'Laptop',
  investments: 'TrendingUp',
  'other income': 'Plus',
  groceries: 'ShoppingCart',
  'dining out': 'UtensilsCrossed',
  transportation: 'Bus',
  fuel: 'Fuel',
  shopping: 'ShoppingBag',
  entertainment: 'Gamepad2',
  health: 'Heart',
  'personal care': 'Sparkles',
  'rent/mortgage': 'Home',
  rent: 'Home',
  mortgage: 'Home',
  electricity: 'Zap',
  water: 'Droplets',
  internet: 'Wifi',
  phone: 'Smartphone',
  subscriptions: 'Repeat',
  insurance: 'Shield',
  gym: 'Dumbbell',
  'emergency fund': 'Umbrella',
  vacation: 'Plane',
  retirement: 'PiggyBank',
  'credit card': 'CreditCard',
  'student loan': 'GraduationCap',
  'car payment': 'Car',
};

export function getCategoryIcon(name: string): string {
  return ICON_MAP[name.toLowerCase()] ?? 'CircleDot';
}

// ─── ID generation ───────────────────────────────────────────────────────────

/**
 * Generate a short, collision-resistant unique ID (no external deps).
 * Format: timestamp base-36 + random base-36 suffix.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}
