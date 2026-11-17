import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import type { UserProfile, WorkspaceListItem } from '@zdoda/shared';
import { auth } from '../lib/firebase';
import { api, ApiError, getActiveWorkspaceId, setActiveWorkspaceId } from '../lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface Session {
  user: UserProfile;
  workspaces: WorkspaceListItem[];
  activeWorkspace: WorkspaceListItem | null;
}

interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  firebaseUser: User | null;
  activeWorkspace: WorkspaceListItem | null;
  workspaces: WorkspaceListItem[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string, workspaceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Please use at least 8 characters for your password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for this project yet.',
};

export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  const code = (err as { code?: string })?.code || '';
  return FIREBASE_ERRORS[code] || (err as Error)?.message || 'Something went wrong. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const pendingSignup = useRef<{ name: string; workspaceName?: string } | null>(null);
  const queryClient = useQueryClient();

  const applySession = useCallback((data: Session) => {
    const saved = getActiveWorkspaceId();
    const active = data.workspaces.find((w) => w.id === saved) || data.activeWorkspace || data.workspaces[0] || null;
    setActiveWorkspaceId(active?.id || null);
    setSession({ ...data, activeWorkspace: active });
    setStatus('authenticated');
  }, []);

  const loadSession = useCallback(async () => {
    try {
      applySession(await api.get<Session>('/auth/me'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NEEDS_BOOTSTRAP') {
        const extra = pendingSignup.current || {};
        applySession(await api.post<Session>('/auth/bootstrap', extra));
        pendingSignup.current = null;
        return;
      }
      throw err;
    }
  }, [applySession]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (!u) {
        setSession(null);
        setStatus('unauthenticated');
        return;
      }
      if (pendingSignup.current) return; // signup() finishes bootstrapping itself
      try {
        await loadSession();
      } catch (err) {
        console.error('[auth] could not load session', err);
        setSession(null);
        setStatus('unauthenticated');
      }
    });
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await loadSession();
    } catch (err) {
      throw new ApiError(authErrorMessage(err), 'AUTH');
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await loadSession();
    } catch (err) {
      throw new ApiError(authErrorMessage(err), 'AUTH');
    }
  };

  const signup = async (name: string, email: string, password: string, workspaceName?: string) => {
    pendingSignup.current = { name, workspaceName: workspaceName || undefined };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });
      await cred.user.getIdToken(true);
      sendEmailVerification(cred.user, { url: `${location.origin}/dashboard` }).catch(() => {});
      await loadSession();
    } catch (err) {
      pendingSignup.current = null;
      throw new ApiError(authErrorMessage(err), 'AUTH');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setActiveWorkspaceId(null);
    queryClient.clear();
  };

  const switchWorkspace = (workspaceId: string) => {
    if (!session?.workspaces.some((w) => w.id === workspaceId)) return;
    setActiveWorkspaceId(workspaceId);
    api.post('/auth/default-workspace', { workspaceId }).catch(() => {});
    window.location.assign('/dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user: session?.user ?? null,
        firebaseUser,
        activeWorkspace: session?.activeWorkspace ?? null,
        workspaces: session?.workspaces ?? [],
        isLoading: status === 'loading',
        switchWorkspace,
        login,
        loginWithGoogle,
        signup,
        logout,
        refresh: loadSession,
        resetPassword: async (email) => {
          try {
            await sendPasswordResetEmail(auth, email.trim(), { url: `${location.origin}/login` });
          } catch (err) {
            const code = (err as { code?: string })?.code;
            if (code !== 'auth/user-not-found') throw new ApiError(authErrorMessage(err), 'AUTH');
          }
        },
        resendVerification: async () => {
          if (auth.currentUser) await sendEmailVerification(auth.currentUser, { url: `${location.origin}/dashboard` });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
