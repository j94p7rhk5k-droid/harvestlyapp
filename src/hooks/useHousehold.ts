'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  createHouseholdInvite,
  acceptHouseholdInvite,
  declineHouseholdInvite,
  cancelHouseholdInvite,
  leaveHousehold,
} from '@/lib/firestore';
import type { UserProfile, HouseholdInvite } from '@/types';

export function useHousehold() {
  const { user, userProfile } = useAuth();

  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<HouseholdInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const isInHousehold = !!(
    userProfile?.householdOwnerId || userProfile?.householdPartnerId
  );
  const isOwner = !!userProfile?.householdPartnerId;

  // Fetch partner profile when in a household
  useEffect(() => {
    if (!userProfile) {
      setPartnerProfile(null);
      return;
    }

    const partnerUid = userProfile.householdOwnerId ?? userProfile.householdPartnerId;
    if (!partnerUid) {
      setPartnerProfile(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', partnerUid), (snap) => {
      if (snap.exists()) {
        setPartnerProfile(snap.data() as UserProfile);
      } else {
        setPartnerProfile(null);
      }
    });

    return unsub;
  }, [userProfile?.householdOwnerId, userProfile?.householdPartnerId]);

  // Listen for pending invites addressed to this user's email
  useEffect(() => {
    if (!user?.email) {
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'householdInvites'),
      where('toEmail', '==', user.email.toLowerCase()),
      where('status', '==', 'pending'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingInvites(snap.docs.map((d) => d.data() as HouseholdInvite));
      setLoading(false);
    });

    return unsub;
  }, [user?.email]);

  // Listen for invites sent by this user
  useEffect(() => {
    if (!user?.uid) {
      setSentInvites([]);
      return;
    }

    const q = query(
      collection(db, 'householdInvites'),
      where('fromUid', '==', user.uid),
      where('status', '==', 'pending'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setSentInvites(snap.docs.map((d) => d.data() as HouseholdInvite));
    });

    return unsub;
  }, [user?.uid]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const sendInvite = useCallback(
    async (email: string) => {
      if (!user || !userProfile) throw new Error('Not authenticated');
      if (isInHousehold) throw new Error('Already in a household');

      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail === user.email?.toLowerCase()) {
        throw new Error('Cannot invite yourself');
      }

      await createHouseholdInvite({
        fromUid: user.uid,
        fromEmail: user.email ?? '',
        fromDisplayName: userProfile.displayName,
        toEmail: normalizedEmail,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    },
    [user, userProfile, isInHousehold],
  );

  const acceptInvite = useCallback(
    async (invite: HouseholdInvite) => {
      if (!user) throw new Error('Not authenticated');
      await acceptHouseholdInvite(invite, user.uid);
    },
    [user],
  );

  const declineInvite = useCallback(
    async (invite: HouseholdInvite) => {
      await declineHouseholdInvite(invite.id);
    },
    [],
  );

  const cancelInvite = useCallback(
    async (invite: HouseholdInvite) => {
      await cancelHouseholdInvite(invite.id);
    },
    [],
  );

  const leave = useCallback(async () => {
    if (!userProfile) throw new Error('Not authenticated');

    const ownerUid = userProfile.householdOwnerId ?? userProfile.uid;
    const partnerUid = userProfile.householdPartnerId ?? userProfile.uid;

    await leaveHousehold(ownerUid, partnerUid);
  }, [userProfile]);

  return {
    isInHousehold,
    isOwner,
    partnerProfile,
    pendingInvites,
    sentInvites,
    loading,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    leaveHousehold: leave,
  };
}
