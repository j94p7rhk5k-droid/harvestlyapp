'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteOldNotifications,
} from '@/lib/firestore';
import type { AppNotification, BudgetMonth } from '@/types';

export function useNotifications(
  userId: string | undefined,
  budgetMonth: BudgetMonth | null,
  partnerBudgetMonth: BudgetMonth | null,
  partnerName: string | undefined,
) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const existingKeys = useRef<Set<string>>(new Set());
  const snapshotReady = useRef(false);
  const prevPartnerTxCount = useRef<number>(-1); // -1 = first load

  // ── Real-time listener for notifications ─────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      snapshotReady.current = false;
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50),
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => d.data() as AppNotification);
      setNotifications(notifs);

      // Build dedup key set
      existingKeys.current = new Set(notifs.map((n) => n.dedupKey));
      snapshotReady.current = true;
    });

    // Cleanup old notifications on mount
    deleteOldNotifications(userId, 30).catch(() => {});

    return unsub;
  }, [userId]);

  // ── Overspend detection ──────────────────────────────────────────────────

  useEffect(() => {
    if (!budgetMonth || !userId || !snapshotReady.current) return;

    for (const cat of budgetMonth.categories) {
      if (
        (cat.type === 'expense' || cat.type === 'bill') &&
        cat.planned > 0 &&
        cat.actual > cat.planned
      ) {
        const key = `overspend-${budgetMonth.month}-${cat.id}`;
        if (!existingKeys.current.has(key)) {
          existingKeys.current.add(key);
          const overBy = cat.actual - cat.planned;
          addNotification(userId, {
            type: 'overspend',
            title: `${cat.name} over budget`,
            message: `You've spent $${cat.actual.toFixed(0)} of your $${cat.planned.toFixed(0)} plan (+$${overBy.toFixed(0)})`,
            read: false,
            createdAt: new Date().toISOString(),
            dedupKey: key,
            meta: { categoryId: cat.id, month: budgetMonth.month },
          }).catch(() => {});
        }
      }
    }
  }, [budgetMonth, userId]);

  // ── Partner activity detection ───────────────────────────────────────────

  useEffect(() => {
    if (!partnerBudgetMonth || !userId || !snapshotReady.current) return;

    const currentCount = partnerBudgetMonth.transactions.length;

    // Skip first load to avoid flagging all existing transactions as "new"
    if (prevPartnerTxCount.current === -1) {
      prevPartnerTxCount.current = currentCount;
      return;
    }

    if (currentCount > prevPartnerTxCount.current) {
      // Find the newest transactions
      const newTxs = partnerBudgetMonth.transactions.slice(prevPartnerTxCount.current);
      for (const tx of newTxs) {
        const key = `partner-${partnerBudgetMonth.month}-${tx.id}`;
        if (!existingKeys.current.has(key)) {
          existingKeys.current.add(key);
          addNotification(userId, {
            type: 'partner_activity',
            title: `${partnerName ?? 'Partner'} added a transaction`,
            message: `$${tx.amount.toFixed(2)} in ${tx.categoryName}`,
            read: false,
            createdAt: new Date().toISOString(),
            dedupKey: key,
            meta: { categoryId: tx.categoryId, month: partnerBudgetMonth.month },
          }).catch(() => {});
        }
      }
    }

    prevPartnerTxCount.current = currentCount;
  }, [partnerBudgetMonth?.transactions.length, userId, partnerName]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const markRead = useCallback(
    (notificationId: string) => {
      if (!userId) return;
      markNotificationRead(userId, notificationId).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    },
    [userId],
  );

  const markAllRead = useCallback(() => {
    if (!userId) return;
    markAllNotificationsRead(userId).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
