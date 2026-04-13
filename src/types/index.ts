// ─── Budget Period ───────────────────────────────────────────────────────────

export interface BudgetPeriod {
  startDate: string;   // ISO date, e.g. "2025-06-01"
  endDate: string;     // ISO date, e.g. "2025-06-30"
  currency: string;    // e.g. "$"
}

// ─── Category ────────────────────────────────────────────────────────────────

export type CategoryType = 'income' | 'expense' | 'bill' | 'savings' | 'debt';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  planned: number;
  actual: number;
  icon?: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  amount: number;
  date: string;        // ISO date
  note?: string;
  isRecurring: boolean;
}

// ─── Budget Month ────────────────────────────────────────────────────────────

export interface BudgetMonth {
  id: string;          // Firestore doc id — same as `month`
  userId: string;
  month: string;       // "2025-06"
  period: BudgetPeriod;
  rollover: number;    // leftover from previous month
  categories: Category[];
  transactions: Transaction[];
}

// ─── Savings Goal ────────────────────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  userId: string;
  fundName: string;
  goalDate?: string;   // ISO date
  goalAmount: number;
  startAmount: number;
  saved: number;       // auto-calculated from transactions
  remaining: number;   // goalAmount - startAmount - saved
  progress: number;    // 0–1
}

// ─── Debt Goal ───────────────────────────────────────────────────────────────

export type DebtType =
  | 'mortgage'
  | 'car loan'
  | 'student loan'
  | 'credit card'
  | 'personal loan'
  | 'medical'
  | 'other';

export interface DebtGoal {
  id: string;
  userId: string;
  debtName: string;
  debtType: DebtType | string;   // allow custom strings too
  goalDate?: string;
  startDebt: number;
  paidOff: number;     // auto-calculated from transactions
  remaining: number;   // startDebt - paidOff
  progress: number;    // 0–1
}

// ─── Goal Transaction ────────────────────────────────────────────────────────

export type GoalType = 'savings' | 'debt';

export interface GoalTransaction {
  id: string;
  goalId: string;
  goalType: GoalType;
  amount: number;
  date: string;
  note?: string;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  currency: string;    // e.g. "$"
  createdAt: string;   // ISO timestamp
  householdOwnerId?: string;   // set on partner — points to the owner's uid
  householdPartnerId?: string; // set on owner — points to the partner's uid
}

// ─── Household Invite ───────────────────────────────────────────────────────

export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface HouseholdInvite {
  id: string;
  fromUid: string;
  fromEmail: string;
  fromDisplayName: string;
  toEmail: string;
  toUid?: string;
  status: InviteStatus;
  createdAt: string;
}

// ─── Dashboard Data (computed) ───────────────────────────────────────────────

export interface DashboardData {
  totalIncomePlanned: number;
  totalIncomeActual: number;
  totalExpensesPlanned: number;
  totalExpensesActual: number;
  totalBillsPlanned: number;
  totalBillsActual: number;
  totalSavingsPlanned: number;
  totalSavingsActual: number;
  totalDebtPlanned: number;
  totalDebtActual: number;
  leftToSpendPlanned: number;
  leftToSpendActual: number;
}

// ─── Utility / Partial types for create/update operations ────────────────────

export type NewCategory = Omit<Category, 'id' | 'actual'>;
export type CategoryUpdate = Partial<Pick<Category, 'name' | 'planned' | 'icon'>>;
export type NewTransaction = Omit<Transaction, 'id'>;
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'saved' | 'remaining' | 'progress'>;
export type NewDebtGoal = Omit<DebtGoal, 'id' | 'paidOff' | 'remaining' | 'progress'>;
export type NewGoalTransaction = Omit<GoalTransaction, 'id'>;
