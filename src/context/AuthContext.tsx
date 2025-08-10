import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, logAnalyticsEvent } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), async (fbUser) => {
      setUser(fbUser);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth(), email, password);
      void logAnalyticsEvent('login', { method: 'password' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth(), email, password);
      // Save displayName if provided
      const displayName = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ').trim();
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      void logAnalyticsEvent('sign_up', { method: 'password' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth(), googleProvider);
      void logAnalyticsEvent('login', { method: 'google' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await fbSignOut(auth());
    void logAnalyticsEvent('logout');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}