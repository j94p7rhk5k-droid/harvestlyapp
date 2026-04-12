import type { Category, CategoryType } from '@/types';

// ─── Plaid → App Category Mapping ──────────────────────────────────────────

interface CategoryMapping {
  type: CategoryType;
  name: string;
}

/**
 * Maps Plaid personal_finance_category primary values to our CategoryType + default name.
 * Each primary key may resolve differently based on detailed sub-category.
 */
export const PLAID_CATEGORY_MAP: Record<string, CategoryMapping> = {
  // Income
  INCOME: { type: 'income', name: 'Other Income' },
  TRANSFER_IN: { type: 'income', name: 'Other Income' },

  // Expenses
  FOOD_AND_DRINK: { type: 'expense', name: 'Dining Out' },
  GENERAL_MERCHANDISE: { type: 'expense', name: 'Shopping' },
  GENERAL_SERVICES: { type: 'expense', name: 'Shopping' },
  PERSONAL_CARE: { type: 'expense', name: 'Personal Care' },
  ENTERTAINMENT: { type: 'expense', name: 'Entertainment' },
  TRAVEL: { type: 'expense', name: 'Transportation' },
  RECREATION: { type: 'expense', name: 'Entertainment' },
  MEDICAL: { type: 'expense', name: 'Health' },
  BANK_FEES: { type: 'expense', name: 'Bank Fees' },
  GOVERNMENT_AND_NON_PROFIT: { type: 'expense', name: 'Taxes & Fees' },

  // Bills
  RENT_AND_UTILITIES: { type: 'bill', name: 'Rent/Mortgage' },
  LOAN_PAYMENTS: { type: 'bill', name: 'Loan Payment' },
  TRANSPORTATION: { type: 'expense', name: 'Transportation' },

  // Transfers / other
  TRANSFER_OUT: { type: 'expense', name: 'Transfers' },
  OTHER: { type: 'expense', name: 'Other' },
};

// ─── Detailed Category Refinement ──────────────────────────────────────────

/**
 * Maps Plaid detailed categories to more specific app category names.
 * Keys are substrings matched against the detailed category string.
 */
const DETAILED_CATEGORY_REFINEMENTS: Record<
  string,
  { name: string; type?: CategoryType }
> = {
  // Food
  GROCERIES: { name: 'Groceries' },
  RESTAURANT: { name: 'Dining Out' },
  COFFEE: { name: 'Dining Out' },
  FAST_FOOD: { name: 'Dining Out' },

  // Transportation
  GAS: { name: 'Fuel' },
  PARKING: { name: 'Transportation' },
  TAXI: { name: 'Transportation' },
  PUBLIC_TRANSIT: { name: 'Transportation' },
  RIDE_SHARE: { name: 'Transportation' },
  TOLLS: { name: 'Transportation' },

  // Utilities
  ELECTRIC: { name: 'Electricity', type: 'bill' },
  WATER: { name: 'Water', type: 'bill' },
  GAS_UTILITY: { name: 'Gas', type: 'bill' },
  INTERNET: { name: 'Internet', type: 'bill' },
  TELEPHONE: { name: 'Phone', type: 'bill' },
  CABLE: { name: 'Subscriptions', type: 'bill' },
  SEWAGE: { name: 'Water', type: 'bill' },
  TRASH: { name: 'Rent/Mortgage', type: 'bill' },
  RENT: { name: 'Rent/Mortgage', type: 'bill' },
  MORTGAGE: { name: 'Rent/Mortgage', type: 'bill' },

  // Insurance
  INSURANCE: { name: 'Insurance', type: 'bill' },

  // Income refinements
  SALARY: { name: 'Salary', type: 'income' },
  WAGES: { name: 'Salary', type: 'income' },
  INTEREST: { name: 'Investments', type: 'income' },
  DIVIDENDS: { name: 'Investments', type: 'income' },
  FREELANCE: { name: 'Freelance', type: 'income' },

  // Subscriptions
  SUBSCRIPTION: { name: 'Subscriptions', type: 'bill' },
  STREAMING: { name: 'Subscriptions', type: 'bill' },
  GYM: { name: 'Gym', type: 'bill' },

  // Medical
  PHARMACY: { name: 'Health' },
  DOCTOR: { name: 'Health' },
  DENTIST: { name: 'Health' },

  // Loan specifics
  STUDENT_LOAN: { name: 'Student Loan', type: 'debt' },
  AUTO_LOAN: { name: 'Car Payment', type: 'debt' },
  CREDIT_CARD_PAYMENT: { name: 'Credit Card', type: 'debt' },
};

// ─── Fuzzy Match ───────────────────────────────────────────────────────────

/**
 * Find the best matching existing category by name + type.
 * Performs case-insensitive "contains" matching in both directions.
 */
export function findBestCategoryMatch(
  name: string,
  type: CategoryType,
  categories: Category[],
): Category | null {
  const lower = name.toLowerCase();

  // Same-type categories only
  const sameType = categories.filter((c) => c.type === type);

  // Exact match (case-insensitive)
  const exact = sameType.find((c) => c.name.toLowerCase() === lower);
  if (exact) return exact;

  // Target name contains category name, or vice versa
  const partial = sameType.find((c) => {
    const catLower = c.name.toLowerCase();
    return catLower.includes(lower) || lower.includes(catLower);
  });
  if (partial) return partial;

  // Word overlap check — if any significant word (3+ chars) matches
  const targetWords = lower.split(/[\s/]+/).filter((w) => w.length >= 3);
  const wordMatch = sameType.find((c) => {
    const catWords = c.name
      .toLowerCase()
      .split(/[\s/]+/)
      .filter((w) => w.length >= 3);
    return targetWords.some((tw) => catWords.some((cw) => cw === tw));
  });
  if (wordMatch) return wordMatch;

  return null;
}

// ─── Main Categorizer ──────────────────────────────────────────────────────

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  type: CategoryType;
}

/**
 * Maps a Plaid transaction to the app's budget category system.
 *
 * Resolution order:
 * 1. If `isIncome` → force type to 'income', try income-specific matching
 * 2. Check detailed category for refined mapping
 * 3. Fall back to primary Plaid category mapping
 * 4. Try to match to an existing user category by name
 * 5. Return the best-guess name/type so the caller can create a new category
 */
export function categorizeTransaction(
  plaidCategory: string,
  detailedCategory: string | undefined,
  merchantName: string | undefined,
  isIncome: boolean,
  existingCategories: Category[],
): CategorizationResult {
  let type: CategoryType;
  let name: string;

  // ── Step 1: Determine base type + name from Plaid primary category ────
  if (isIncome) {
    type = 'income';
    name = 'Other Income';
  } else {
    const mapping = PLAID_CATEGORY_MAP[plaidCategory];
    if (mapping) {
      type = mapping.type;
      name = mapping.name;
    } else {
      type = 'expense';
      name = 'Other';
    }
  }

  // ── Step 2: Refine using detailed category ────────────────────────────
  if (detailedCategory) {
    const detailedUpper = detailedCategory.toUpperCase();
    for (const [key, refinement] of Object.entries(
      DETAILED_CATEGORY_REFINEMENTS,
    )) {
      if (detailedUpper.includes(key)) {
        name = refinement.name;
        if (refinement.type) {
          // Only override type if not income (income flag takes priority)
          if (!isIncome) {
            type = refinement.type;
          }
        }
        break;
      }
    }

    // Special income refinements (even if not flagged as general income category)
    if (isIncome) {
      for (const [key, refinement] of Object.entries(
        DETAILED_CATEGORY_REFINEMENTS,
      )) {
        if (refinement.type === 'income' && detailedUpper.includes(key)) {
          name = refinement.name;
          break;
        }
      }
    }
  }

  // ── Step 3: Special handling for TRANSPORTATION — recurring = bill ────
  if (
    plaidCategory === 'TRANSPORTATION' &&
    !isIncome &&
    detailedCategory
  ) {
    const detailedUpper = detailedCategory.toUpperCase();
    if (
      detailedUpper.includes('INSURANCE') ||
      detailedUpper.includes('AUTO_LOAN') ||
      detailedUpper.includes('LEASE')
    ) {
      type = 'bill';
    }
  }

  // ── Step 4: Try to match to existing user category ────────────────────
  const match = findBestCategoryMatch(name, type, existingCategories);
  if (match) {
    return {
      categoryId: match.id,
      categoryName: match.name,
      type: match.type,
    };
  }

  // ── Step 5: No existing match — return suggested name/type ────────────
  // Use empty string for categoryId to signal "needs creation"
  return {
    categoryId: '',
    categoryName: name,
    type,
  };
}
