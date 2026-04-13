import type { BudgetMonth, Category, Transaction } from '@/types';

/**
 * Merge two BudgetMonth objects into a combined read-only view.
 * Categories with the same name are summed. Transactions are concatenated.
 */
export function mergeBudgetMonths(
  a: BudgetMonth | null,
  b: BudgetMonth | null,
): BudgetMonth | null {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;

  // Merge categories by name
  const categoryMap = new Map<string, Category>();

  for (const cat of a.categories) {
    categoryMap.set(cat.name.toLowerCase(), { ...cat });
  }

  for (const cat of b.categories) {
    const key = cat.name.toLowerCase();
    const existing = categoryMap.get(key);
    if (existing) {
      existing.planned += cat.planned;
      existing.actual += cat.actual;
    } else {
      categoryMap.set(key, { ...cat });
    }
  }

  // Merge transactions (concatenate, tag with source)
  const mergedTransactions: Transaction[] = [
    ...a.transactions,
    ...b.transactions,
  ].sort((x, y) => y.date.localeCompare(x.date));

  return {
    id: a.id,
    userId: a.userId,
    month: a.month,
    period: a.period,
    rollover: a.rollover + b.rollover,
    categories: Array.from(categoryMap.values()),
    transactions: mergedTransactions,
  };
}
