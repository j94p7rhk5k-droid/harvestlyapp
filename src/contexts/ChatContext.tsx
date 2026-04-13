'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import type { ChatMessage, ChatAction, ChatRequest, FileAttachment } from '@/types/chat';
import type { Category, NewCategory, NewTransaction, BudgetMonth } from '@/types';
import { processFile } from '@/lib/csv-parser';
import { playSend, playReceive, playSuccess, playError, playOpen, playClose } from '@/lib/sounds';
import { useAuth } from './AuthContext';
import {
  addTransaction as fsAddTransaction,
  addCategory as fsAddCategory,
  getBudgetMonth,
  clearBudgetMonth,
  clearAllBudgetData,
  saveChatHistory,
  loadChatHistory,
} from '@/lib/firestore';

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Extract "YYYY-MM" from a date string like "2026-03-15" */
function getMonthFromDate(date: string): string {
  const parts = date.split('-');
  if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  return new Date().toISOString().slice(0, 7);
}

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (text: string, files?: File[]) => void;
  setBudgetHooks: (hooks: BudgetHooks) => void;
}

interface BudgetHooks {
  effectiveUserId: string | undefined;
  month: string;
  currency: string;
  budgetMonth: BudgetMonth | null;
  addCategory: (cat: NewCategory) => Promise<Category>;
  addTransaction: (tx: NewTransaction) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
}

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey! I'm your Harvestly assistant. I can help you manage your budget — just tell me about your income and expenses, or drop a bank statement to import transactions. What can I help with?",
  timestamp: new Date().toISOString(),
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [isOpen, setIsOpenRaw] = useState(false);
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenRaw(open);
    if (open) playOpen();
    else playClose();
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Store budget hooks in a ref so the context doesn't re-render when they change
  const hooksRef = useRef<BudgetHooks | null>(null);

  // Load chat history from Firestore on login
  useEffect(() => {
    if (!user?.uid) {
      setMessages([WELCOME_MSG]);
      setHistoryLoaded(false);
      return;
    }

    let cancelled = false;
    loadChatHistory(user.uid).then((saved) => {
      if (cancelled) return;
      if (saved.length > 0) {
        setMessages([WELCOME_MSG, ...saved]);
      }
      setHistoryLoaded(true);
    }).catch(() => {
      setHistoryLoaded(true);
    });

    return () => { cancelled = true; };
  }, [user?.uid]);

  // Save chat history to Firestore whenever messages change (after initial load)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user?.uid || !historyLoaded) return;
    // Debounce saves to avoid rapid writes
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveChatHistory(user.uid, messages).catch(() => {});
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, user?.uid, historyLoaded]);
  const createdCategoriesRef = useRef<Map<string, string>>(new Map());

  const setBudgetHooks = useCallback((hooks: BudgetHooks) => {
    hooksRef.current = hooks;
  }, []);

  // ── Execute a single action ──────────────────────────────────────────────

  const executeAction = useCallback(
    async (action: ChatAction): Promise<void> => {
      const hooks = hooksRef.current;
      if (!hooks) throw new Error('Budget hooks not available');

      const { addCategory, addTransaction, deleteTransaction, updateCategory, budgetMonth } = hooks;

      switch (action.type) {
        case 'add_category': {
          const { name, type, planned } = action.params;
          const created = await addCategory({ name, type, planned: planned ?? 0 });
          createdCategoriesRef.current.set(name.toLowerCase(), created.id);
          break;
        }
        case 'add_transaction': {
          const { categoryName, categoryId, type, amount, date, note, isRecurring } = action.params;
          const txMonth = getMonthFromDate(date);
          const targetMonth = txMonth || hooks.month;

          let resolvedId = categoryId;
          if (!resolvedId || resolvedId === '') {
            resolvedId = createdCategoriesRef.current.get(categoryName.toLowerCase());
          }
          if (!resolvedId) {
            const existing = budgetMonth?.categories.find(
              (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
            );
            resolvedId = existing?.id ?? '';
          }
          if (!resolvedId) {
            throw new Error(`Category "${categoryName}" not found`);
          }

          // Write directly to the correct month (may differ from current view)
          if (targetMonth !== hooks.month) {
            // Ensure category exists in the target month too
            const targetBm = await getBudgetMonth(hooks.effectiveUserId!, targetMonth);
            const catInTarget = targetBm.categories.find(
              (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
            );
            if (!catInTarget) {
              await fsAddCategory(hooks.effectiveUserId!, targetMonth, { name: categoryName, type, planned: 0 });
              const refreshed = await getBudgetMonth(hooks.effectiveUserId!, targetMonth);
              const newCat = refreshed.categories.find(
                (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
              );
              resolvedId = newCat?.id ?? resolvedId;
            } else {
              resolvedId = catInTarget.id;
            }
            await fsAddTransaction(hooks.effectiveUserId!, targetMonth, {
              categoryId: resolvedId,
              categoryName,
              type,
              amount,
              date,
              note: note ?? '',
              isRecurring: isRecurring ?? false,
            });
          } else {
            await addTransaction({
              categoryId: resolvedId,
              categoryName,
              type,
              amount,
              date,
              note: note ?? '',
              isRecurring: isRecurring ?? false,
            });
          }
          break;
        }
        case 'delete_transaction': {
          const { transactionId } = action.params;
          await deleteTransaction(transactionId);
          break;
        }
        case 'update_category_budget': {
          const { categoryId, planned } = action.params;
          await updateCategory(categoryId, { planned });
          break;
        }
        case 'clear_data': {
          const { scope, month } = action.params;
          const userId = hooks.effectiveUserId!;
          if (scope === 'all') {
            await clearAllBudgetData(userId);
          } else if (scope === 'month' && month) {
            await clearBudgetMonth(userId, month);
          }
          break;
        }
        case 'import_transactions': {
          let { transactions } = action.params;
          if (!Array.isArray(transactions)) {
            transactions = transactions ? [transactions] : [];
          }
          const userId = hooks.effectiveUserId!;
          for (const tx of transactions) {
            const txMonth = getMonthFromDate(tx.date);
            const targetMonth = txMonth || hooks.month;

            // Ensure category exists in the target month
            const targetBm = await getBudgetMonth(userId, targetMonth);
            let resolvedId = '';
            const catInTarget = targetBm.categories.find(
              (c) => c.name.toLowerCase() === tx.categoryName?.toLowerCase(),
            );
            if (catInTarget) {
              resolvedId = catInTarget.id;
            } else {
              // Check if we created it earlier in this batch
              resolvedId = createdCategoriesRef.current.get(tx.categoryName?.toLowerCase()) ?? '';
              if (!resolvedId) {
                const created = await fsAddCategory(userId, targetMonth, {
                  name: tx.categoryName,
                  type: tx.type,
                  planned: 0,
                });
                resolvedId = created.id;
                createdCategoriesRef.current.set(tx.categoryName.toLowerCase(), created.id);
              }
            }

            await fsAddTransaction(userId, targetMonth, {
              categoryId: resolvedId,
              categoryName: tx.categoryName,
              type: tx.type,
              amount: tx.amount,
              date: tx.date,
              note: tx.note ?? '',
              isRecurring: tx.isRecurring ?? false,
            });
          }
          break;
        }
      }
    },
    [],
  );

  // ── Send a message ───────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, files?: File[]) => {
      const hooks = hooksRef.current;
      if (!text.trim() && (!files || files.length === 0)) return;
      if (!hooks?.effectiveUserId) return;

      // Process files
      let parsedFiles: FileAttachment[] | undefined;
      let fileInfo: ChatMessage['fileInfo'] | undefined;

      if (files && files.length > 0) {
        const totalSize = files.reduce((s, f) => s + f.size, 0);
        const MAX_SIZE = 3 * 1024 * 1024;

        if (totalSize > MAX_SIZE) {
          const errorMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: `Those files are too large (${(totalSize / 1024 / 1024).toFixed(1)}MB total). Please upload files under 3MB total, or upload them one at a time.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, {
            id: generateId(),
            role: 'user',
            content: text || `Tried to upload: ${files.map((f) => f.name).join(', ')}`,
            timestamp: new Date().toISOString(),
            fileInfo: { name: files.map((f) => f.name).join(', '), type: files[0].type, size: totalSize },
          }, errorMsg]);
          return;
        }

        fileInfo = { name: files.map((f) => f.name).join(', '), type: files[0].type, size: totalSize };
        try {
          parsedFiles = await Promise.all(files.map(processFile));
        } catch {
          parsedFiles = undefined;
        }
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text || `Uploaded ${files?.length ?? 0} file(s): ${files?.map((f) => f.name).join(', ')}`,
        timestamp: new Date().toISOString(),
        fileInfo,
      };
      setMessages((prev) => [...prev, userMsg]);
      playSend();
      setIsLoading(true);

      try {
        // Build conversation history
        const allMessages = [...messages, userMsg];
        const history = allMessages.filter((m) => m.id !== 'welcome').map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        // Build budget context
        const { month, currency, budgetMonth } = hooks;
        const categories = budgetMonth?.categories ?? [];
        const recentTransactions = (budgetMonth?.transactions ?? [])
          .slice(-20)
          .map((t) => ({
            id: t.id,
            categoryName: t.categoryName,
            type: t.type,
            amount: t.amount,
            date: t.date,
            note: t.note,
          }));

        const requestBody: ChatRequest = {
          messages: history,
          budgetContext: { month, categories, recentTransactions, currency },
          files: parsedFiles,
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error(res.status === 413 ? 'Files are too large. Try uploading one at a time or smaller files.' : `Server error (${res.status}). Please try again.`);
        }

        if (!res.ok) {
          throw new Error(data.error ?? data.details ?? `API error: ${res.status}`);
        }

        // Execute actions
        const executedActions: ChatAction[] = [];
        if (data.actions && data.actions.length > 0) {
          for (const action of data.actions) {
            const chatAction: ChatAction = {
              id: action.id,
              type: action.type,
              params: action.params,
              status: 'pending',
            };
            try {
              await executeAction(chatAction);
              chatAction.status = 'executed';
            } catch (err: any) {
              chatAction.status = 'failed';
              chatAction.error = err.message;
            }
            executedActions.push(chatAction);
          }
        }

        // Add assistant message
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.content || 'Done!',
          timestamp: new Date().toISOString(),
          actions: executedActions.length > 0 ? executedActions : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        // Play success sound if actions executed, receive sound otherwise
        if (executedActions.length > 0 && executedActions.every((a) => a.status === 'executed')) {
          playSuccess();
        } else {
          playReceive();
        }
      } catch (err: any) {
        console.error('[ChatContext] Error:', err);
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I ran into an issue: ${err.message}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        playError();
      } finally {
        setIsLoading(false);
      }
    },
    [messages, executeAction],
  );

  return (
    <ChatContext.Provider value={{ messages, isOpen, isLoading, setIsOpen, sendMessage, setBudgetHooks }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (ctx === undefined) {
    throw new Error('useChatContext must be used within a <ChatProvider>');
  }
  return ctx;
}
