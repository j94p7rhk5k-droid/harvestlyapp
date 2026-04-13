import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
  type DocumentReference,
  type CollectionReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  BudgetMonth,
  BudgetPeriod,
  Category,
  CategoryType,
  Transaction,
  SavingsGoal,
  DebtGoal,
  GoalTransaction,
  NewCategory,
  NewTransaction,
  NewSavingsGoal,
  NewDebtGoal,
  NewGoalTransaction,
  HouseholdInvite,
} from '@/types';
import { generateId, getCurrentMonth } from './utils';

// ─── Collection helpers ──────────────────────────────────────────────────────

function budgetMonthRef(userId: string, month: string): DocumentReference {
  return doc(db, 'users', userId, 'budgetMonths', month);
}

function savingsGoalsCol(userId: string): CollectionReference {
  return collection(db, 'users', userId, 'savingsGoals');
}

function debtGoalsCol(userId: string): CollectionReference {
  return collection(db, 'users', userId, 'debtGoals');
}

function goalTransactionsCol(userId: string): CollectionReference {
  return collection(db, 'users', userId, 'goalTransactions');
}

// ─── Budget Month ────────────────────────────────────────────────────────────

/**
 * Fetch a budget month. If it doesn't exist, create one with defaults.
 */
export async function getBudgetMonth(
  userId: string,
  month: string,
): Promise<BudgetMonth> {
  const ref = budgetMonthRef(userId, month);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as BudgetMonth;
  }

  // First access for this month — bootstrap with defaults
  const created = createDefaultBudgetMonth(userId, month);
  await setDoc(ref, created);
  return created;
}

/**
 * Persist the full budget month document (overwrite).
 */
export async function saveBudgetMonth(budgetMonth: BudgetMonth): Promise<void> {
  const ref = budgetMonthRef(budgetMonth.userId, budgetMonth.month);
  await setDoc(ref, budgetMonth);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function addCategory(
  userId: string,
  month: string,
  category: NewCategory,
): Promise<Category> {
  const bm = await getBudgetMonth(userId, month);
  const full: Category = { ...category, id: generateId(), actual: 0 };
  bm.categories.push(full);
  await saveBudgetMonth(bm);
  return full;
}

export async function updateCategory(
  userId: string,
  month: string,
  categoryId: string,
  updates: Partial<Category>,
): Promise<void> {
  const bm = await getBudgetMonth(userId, month);
  const idx = bm.categories.findIndex((c) => c.id === categoryId);
  if (idx === -1) throw new Error(`Category ${categoryId} not found`);
  bm.categories[idx] = { ...bm.categories[idx], ...updates };
  await saveBudgetMonth(bm);
}

export async function deleteCategory(
  userId: string,
  month: string,
  categoryId: string,
): Promise<void> {
  const bm = await getBudgetMonth(userId, month);
  bm.categories = bm.categories.filter((c) => c.id !== categoryId);
  // Also remove any transactions tied to that category
  bm.transactions = bm.transactions.filter((t) => t.categoryId !== categoryId);
  await saveBudgetMonth(bm);
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function addTransaction(
  userId: string,
  month: string,
  transaction: NewTransaction,
): Promise<Transaction> {
  const bm = await getBudgetMonth(userId, month);
  const full: Transaction = { ...transaction, id: generateId() };
  bm.transactions.push(full);
  // Recalculate the category actual
  recalcCategoryActuals(bm);
  await saveBudgetMonth(bm);
  return full;
}

export async function deleteTransaction(
  userId: string,
  month: string,
  transactionId: string,
): Promise<void> {
  const bm = await getBudgetMonth(userId, month);
  bm.transactions = bm.transactions.filter((t) => t.id !== transactionId);
  recalcCategoryActuals(bm);
  await saveBudgetMonth(bm);
}

/**
 * Fetch recent transactions across the most recent N budget months.
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 20,
): Promise<Transaction[]> {
  const colRef = collection(db, 'users', userId, 'budgetMonths');
  const q = query(colRef, orderBy('month', 'desc'), firestoreLimit(3));
  const snap = await getDocs(q);

  const all: Transaction[] = [];
  snap.forEach((doc) => {
    const bm = doc.data() as BudgetMonth;
    all.push(...(bm.transactions ?? []));
  });

  // Sort descending by date and trim
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all.slice(0, limit);
}

// ─── Savings Goals ───────────────────────────────────────────────────────────

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const snap = await getDocs(savingsGoalsCol(userId));
  return snap.docs.map((d) => d.data() as SavingsGoal);
}

export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  const ref = doc(db, 'users', goal.userId, 'savingsGoals', goal.id);
  await setDoc(ref, goal);
}

export async function deleteSavingsGoal(
  userId: string,
  goalId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'savingsGoals', goalId);
  await deleteDoc(ref);
}

// ─── Debt Goals ──────────────────────────────────────────────────────────────

export async function getDebtGoals(userId: string): Promise<DebtGoal[]> {
  const snap = await getDocs(debtGoalsCol(userId));
  return snap.docs.map((d) => d.data() as DebtGoal);
}

export async function saveDebtGoal(goal: DebtGoal): Promise<void> {
  const ref = doc(db, 'users', goal.userId, 'debtGoals', goal.id);
  await setDoc(ref, goal);
}

export async function deleteDebtGoal(
  userId: string,
  goalId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'debtGoals', goalId);
  await deleteDoc(ref);
}

// ─── Goal Transactions ───────────────────────────────────────────────────────

export async function addGoalTransaction(
  userId: string,
  transaction: NewGoalTransaction,
): Promise<GoalTransaction> {
  const full: GoalTransaction = { ...transaction, id: generateId() };
  const ref = doc(db, 'users', userId, 'goalTransactions', full.id);
  await setDoc(ref, full);

  // Recalculate the parent goal's totals
  await recalcGoalTotals(userId, transaction.goalId, transaction.goalType);

  return full;
}

export async function getGoalTransactions(
  userId: string,
  goalId: string,
): Promise<GoalTransaction[]> {
  const q = query(
    goalTransactionsCol(userId),
    where('goalId', '==', goalId),
    orderBy('date', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as GoalTransaction);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Recalculate `actual` for every category in a budget month based on its
 * transactions array.
 */
function recalcCategoryActuals(bm: BudgetMonth): void {
  // Zero-out
  const totals = new Map<string, number>();
  for (const t of bm.transactions) {
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  for (const cat of bm.categories) {
    cat.actual = totals.get(cat.id) ?? 0;
  }
}

/**
 * After a goal transaction is added, re-sum saved/paidOff and update the goal.
 */
async function recalcGoalTotals(
  userId: string,
  goalId: string,
  goalType: 'savings' | 'debt',
): Promise<void> {
  const txns = await getGoalTransactions(userId, goalId);
  const total = txns.reduce((sum, t) => sum + t.amount, 0);

  if (goalType === 'savings') {
    const ref = doc(db, 'users', userId, 'savingsGoals', goalId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const goal = snap.data() as SavingsGoal;
    goal.saved = total;
    goal.remaining = Math.max(0, goal.goalAmount - goal.startAmount - goal.saved);
    goal.progress =
      goal.goalAmount > 0
        ? Math.min(1, (goal.startAmount + goal.saved) / goal.goalAmount)
        : 0;
    await setDoc(ref, goal);
  } else {
    const ref = doc(db, 'users', userId, 'debtGoals', goalId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const goal = snap.data() as DebtGoal;
    goal.paidOff = total;
    goal.remaining = Math.max(0, goal.startDebt - goal.paidOff);
    goal.progress =
      goal.startDebt > 0 ? Math.min(1, goal.paidOff / goal.startDebt) : 0;
    await setDoc(ref, goal);
  }
}

// ─── Default budget month factory ────────────────────────────────────────────

export function createDefaultBudgetMonth(
  userId: string,
  month: string,
): BudgetMonth {
  // Derive period start/end from "YYYY-MM"
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const mo = parseInt(monthStr, 10);
  const startDate = `${month}-01`;
  const lastDay = new Date(year, mo, 0).getDate(); // 0th day of next month = last day
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  const cat = (
    name: string,
    type: CategoryType,
    planned: number = 0,
    icon?: string,
  ): Category => ({
    id: generateId(),
    name,
    type,
    planned,
    actual: 0,
    icon,
  });

  const categories: Category[] = [
    // Income
    cat('Salary', 'income', 0, 'Banknote'),
    cat('Freelance', 'income', 0, 'Laptop'),
    cat('Investments', 'income', 0, 'TrendingUp'),
    cat('Other Income', 'income', 0, 'Plus'),

    // Expenses
    cat('Groceries', 'expense', 0, 'ShoppingCart'),
    cat('Dining Out', 'expense', 0, 'UtensilsCrossed'),
    cat('Transportation', 'expense', 0, 'Bus'),
    cat('Fuel', 'expense', 0, 'Fuel'),
    cat('Shopping', 'expense', 0, 'ShoppingBag'),
    cat('Entertainment', 'expense', 0, 'Gamepad2'),
    cat('Health', 'expense', 0, 'Heart'),
    cat('Personal Care', 'expense', 0, 'Sparkles'),

    // Bills
    cat('Rent/Mortgage', 'bill', 0, 'Home'),
    cat('Electricity', 'bill', 0, 'Zap'),
    cat('Water', 'bill', 0, 'Droplets'),
    cat('Internet', 'bill', 0, 'Wifi'),
    cat('Phone', 'bill', 0, 'Smartphone'),
    cat('Subscriptions', 'bill', 0, 'Repeat'),
    cat('Insurance', 'bill', 0, 'Shield'),
    cat('Gym', 'bill', 0, 'Dumbbell'),

    // Savings
    cat('Emergency Fund', 'savings', 0, 'Umbrella'),
    cat('Vacation', 'savings', 0, 'Plane'),
    cat('Retirement', 'savings', 0, 'PiggyBank'),

    // Debt
    cat('Credit Card', 'debt', 0, 'CreditCard'),
    cat('Student Loan', 'debt', 0, 'GraduationCap'),
    cat('Car Payment', 'debt', 0, 'Car'),
  ];

  return {
    id: month,
    userId,
    month,
    period: { startDate, endDate, currency: '$' },
    rollover: 0,
    categories,
    transactions: [],
  };
}

// ─── Household Invites ──────────────────────────────────────────────────────

const householdInvitesCol = collection(db, 'householdInvites');

export async function createHouseholdInvite(
  invite: Omit<HouseholdInvite, 'id'>,
): Promise<HouseholdInvite> {
  const id = generateId();
  const full: HouseholdInvite = { ...invite, id };
  await setDoc(doc(db, 'householdInvites', id), full);
  return full;
}

export async function getPendingInvitesForEmail(
  email: string,
): Promise<HouseholdInvite[]> {
  const q = query(
    householdInvitesCol,
    where('toEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as HouseholdInvite);
}

export async function getSentInvites(
  fromUid: string,
): Promise<HouseholdInvite[]> {
  const q = query(
    householdInvitesCol,
    where('fromUid', '==', fromUid),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as HouseholdInvite);
}

export async function acceptHouseholdInvite(
  invite: HouseholdInvite,
  currentUid: string,
): Promise<void> {
  const batch = writeBatch(db);

  // Update invite status
  batch.update(doc(db, 'householdInvites', invite.id), {
    status: 'accepted',
    toUid: currentUid,
  });

  // Owner gets a pointer to the partner
  batch.update(doc(db, 'users', invite.fromUid), {
    householdPartnerId: currentUid,
  });

  // Partner gets a pointer to the owner
  batch.update(doc(db, 'users', currentUid), {
    householdOwnerId: invite.fromUid,
  });

  await batch.commit();
}

export async function declineHouseholdInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db, 'householdInvites', inviteId), {
    status: 'declined',
  });
}

export async function cancelHouseholdInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, 'householdInvites', inviteId));
}

export async function leaveHousehold(
  ownerUid: string,
  partnerUid: string,
): Promise<void> {
  const batch = writeBatch(db);

  batch.update(doc(db, 'users', ownerUid), {
    householdPartnerId: deleteField(),
  });

  batch.update(doc(db, 'users', partnerUid), {
    householdOwnerId: deleteField(),
  });

  await batch.commit();
}

// ─── Notifications ──────────────────────────────────────────────────────────

function notificationsCol(userId: string): CollectionReference {
  return collection(db, 'users', userId, 'notifications');
}

export async function addNotification(
  userId: string,
  notification: Omit<AppNotification, 'id'>,
): Promise<void> {
  const id = generateId();
  await setDoc(doc(db, 'users', userId, 'notifications', id), { ...notification, id });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(notificationsCol(userId), where('read', '==', false));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function deleteOldNotifications(userId: string, olderThanDays: number = 30): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const q = query(notificationsCol(userId), where('createdAt', '<', cutoff.toISOString()));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// ─── Chat History ───────────────────────────────────────────────────────────

import type { ChatMessage } from '@/types/chat';
import type { AppNotification } from '@/types';

const MAX_CHAT_MESSAGES = 10;

export async function saveChatHistory(
  userId: string,
  messages: ChatMessage[],
): Promise<void> {
  // Keep only the last N messages (exclude the welcome message)
  const toSave = messages
    .filter((m) => m.id !== 'welcome')
    .slice(-MAX_CHAT_MESSAGES);
  const ref = doc(db, 'users', userId, 'chatHistory', 'latest');
  await setDoc(ref, { messages: toSave, updatedAt: new Date().toISOString() });
}

export async function loadChatHistory(
  userId: string,
): Promise<ChatMessage[]> {
  const ref = doc(db, 'users', userId, 'chatHistory', 'latest');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return (snap.data().messages ?? []) as ChatMessage[];
  }
  return [];
}

// ─── Clear Data ─────────────────────────────────────────────────────────────

/**
 * Clear a specific month's budget data (categories, transactions).
 */
export async function clearBudgetMonth(
  userId: string,
  month: string,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'budgetMonths', month);
  await deleteDoc(ref);
}

/**
 * Clear ALL budget months, goals, and goal transactions for a user.
 */
export async function clearAllBudgetData(userId: string): Promise<void> {
  const colRef = collection(db, 'users', userId, 'budgetMonths');
  const snap = await getDocs(colRef);
  const batch1 = writeBatch(db);
  snap.docs.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  const savingsSnap = await getDocs(collection(db, 'users', userId, 'savingsGoals'));
  const debtSnap = await getDocs(collection(db, 'users', userId, 'debtGoals'));
  const goalTxSnap = await getDocs(collection(db, 'users', userId, 'goalTransactions'));

  const batch2 = writeBatch(db);
  savingsSnap.docs.forEach((d) => batch2.delete(d.ref));
  debtSnap.docs.forEach((d) => batch2.delete(d.ref));
  goalTxSnap.docs.forEach((d) => batch2.delete(d.ref));
  await batch2.commit();
}
