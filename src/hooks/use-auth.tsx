'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Models } from 'appwrite';
import { account, databases, DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite';
import type { UserProfile, UserRole } from '@/types/platform';

// Session cookie name — used by middleware to check auth
export const SESSION_COOKIE = 'appwrite_session';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    role: null
  });

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.users, userId);
      return {
        userId: doc.userId,
        role: doc.role,
        displayName: doc.displayName,
        email: doc.email,
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    } catch {
      // Profile may not exist yet (registration flow)
      return null;
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      // Try server-side session check first (works with httpOnly cookie)
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.profile) {
          setState({
            user: {
              $id: data.user.$id,
              name: data.user.name,
              email: data.user.email,
              emailVerification: data.user.emailVerification ?? false
            } as Models.User<Models.Preferences>,
            profile: data.profile,
            isLoading: false,
            isAuthenticated: true,
            role: data.profile.role ?? null
          });
          return;
        }
      }

      // Fallback: try client-side SDK (for client-managed sessions)
      const user = await account.get();
      const profile = await fetchProfile(user.$id);
      setState({
        user,
        profile,
        isLoading: false,
        isAuthenticated: true,
        role: profile?.role ?? null
      });
    } catch {
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        role: null
      });
    }
  }, [fetchProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Inloggning misslyckades');
      await checkSession();
    },
    [checkSession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name, role: 'student' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrering misslyckades');
      await checkSession();
    },
    [checkSession]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch {
      // Session may already be expired
    }
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore
    }
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      role: null
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.$id);
      setState((prev) => ({
        ...prev,
        profile,
        role: profile?.role ?? null
      }));
    }
  }, [state.user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 * Replaces Clerk's useUser(), useAuth(), useOrganization().
 */
export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  return context;
}

/**
 * Convenience hook for role checking.
 * Returns true if the current user has the specified role.
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { role: userRole } = useUser();
  if (!userRole) return false;
  if (Array.isArray(role)) return role.includes(userRole);
  return userRole === role;
}
