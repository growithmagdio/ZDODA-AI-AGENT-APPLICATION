import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { UserProfile, WorkspaceListItem } from '@zdoda/shared';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  activeWorkspace: WorkspaceListItem | null;
  workspaces: WorkspaceListItem[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, workspaceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceListItem | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);

  const fetchSession = async () => {
    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
      setWorkspaces(data.workspaces || []);

      const savedWsId = localStorage.getItem('zdoda_active_workspace_id');
      const matched = data.workspaces?.find((w: WorkspaceListItem) => w.id === savedWsId);

      if (matched) {
        setActiveWorkspace(matched);
      } else if (data.activeWorkspace) {
        setActiveWorkspace(data.activeWorkspace);
        localStorage.setItem('zdoda_active_workspace_id', data.activeWorkspace.id);
      }
      setStatus('authenticated');
    } catch {
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('zdoda_active_workspace_id', ws.id);
      window.location.reload();
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setWorkspaces(data.workspaces || []);
    if (data.activeWorkspace) {
      setActiveWorkspace(data.activeWorkspace);
      localStorage.setItem('zdoda_active_workspace_id', data.activeWorkspace.id);
    }
    setStatus('authenticated');
  };

  const signup = async (name: string, email: string, password: string, workspaceName?: string) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, workspaceName }),
    });
    setUser(data.user);
    if (data.workspace) {
      setActiveWorkspace(data.workspace);
      setWorkspaces([data.workspace]);
      localStorage.setItem('zdoda_active_workspace_id', data.workspace.id);
    }
    setStatus('authenticated');
  };

  const logout = async () => {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setActiveWorkspace(null);
    setWorkspaces([]);
    localStorage.removeItem('zdoda_active_workspace_id');
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        activeWorkspace,
        workspaces,
        isLoading: status === 'loading',
        switchWorkspace,
        login,
        signup,
        logout,
        refresh: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
