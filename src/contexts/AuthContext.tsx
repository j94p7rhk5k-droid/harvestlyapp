'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/types';

// ─── Context shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  /** The uid to use for all data reads/writes (owner's uid when in a household) */
  effectiveUserId: string | undefined;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // The uid to use for all data operations — partner uses owner's uid
  const effectiveUserId = useMemo(
    () => userProfile?.householdOwnerId ?? user?.uid ?? undefined,
    [userProfile?.householdOwnerId, user?.uid],
  );

  // Ensure a Firestore profile doc exists for the given Firebase user.
  const ensureProfile = useCallback(async (firebaseUser: User) => {
    const profileRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(profileRef);

    if (snap.exists()) {
      // Update mutable fields (display name / photo may change)
      const existing = snap.data() as UserProfile;
      const updated: UserProfile = {
        ...existing,
        displayName: firebaseUser.displayName ?? existing.displayName,
        photoURL: firebaseUser.photoURL ?? existing.photoURL,
        email: firebaseUser.email ?? existing.email,
      };
      await setDoc(profileRef, updated, { merge: true });
    } else {
      // First-time user — create profile
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? '',
        photoURL: firebaseUser.photoURL ?? '',
        currency: '$',
        createdAt: new Date().toISOString(),
      };
      await setDoc(profileRef, newProfile);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    let settled = false;
    let unsubProfile: (() => void) | null = null;

    const settle = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const unsubAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);

        // Tear down previous profile listener
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        if (firebaseUser) {
          // Ensure profile exists, then start real-time listener
          ensureProfile(firebaseUser)
            .then(() => {
              const profileRef = doc(db, 'users', firebaseUser.uid);
              unsubProfile = onSnapshot(profileRef, (snap) => {
                if (snap.exists()) {
                  setUserProfile(snap.data() as UserProfile);
                }
                settle();
              });
            })
            .catch(() => {
              settle();
            });
        } else {
          setUserProfile(null);
          settle();
        }
      },
      () => {
        settle();
      },
    );

    // Safety timeout
    const timeout = setTimeout(settle, 3000);

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      clearTimeout(timeout);
    };
  }, [ensureProfile]);

  // ── Public methods ───────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Profile sync happens automatically via onAuthStateChanged listener
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('[AuthContext] Google sign-in failed:', err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('[AuthContext] Sign-out failed:', err);
      throw err;
    }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{ user, userProfile, effectiveUserId, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
