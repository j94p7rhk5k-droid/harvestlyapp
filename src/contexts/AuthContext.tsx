'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/types';

// ─── Context shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
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

  // Fetch or create the Firestore user profile for a given Firebase user.
  const syncProfile = useCallback(async (firebaseUser: User) => {
    try {
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
        setUserProfile(updated);
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
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to sync user profile:', err);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          syncProfile(firebaseUser).catch(() => {}).finally(settle);
        } else {
          setUserProfile(null);
          settle();
        }
      },
      () => {
        // Auth error — unblock UI anyway
        settle();
      },
    );

    // Safety timeout — if Firebase never fires, unblock the UI
    const timeout = setTimeout(settle, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [syncProfile]);

  // ── Public methods ───────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Profile sync happens automatically via onAuthStateChanged,
      // but we can also eagerly sync here for faster UX.
      if (result.user) {
        await syncProfile(result.user);
      }
    } catch (err: any) {
      // Ignore popup-closed-by-user — it's not an error
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('[AuthContext] Google sign-in failed:', err);
      throw err;
    }
  }, [syncProfile]);

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
      value={{ user, userProfile, loading, signInWithGoogle, signOut }}
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
