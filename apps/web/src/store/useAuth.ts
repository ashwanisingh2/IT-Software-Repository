import { create } from 'zustand';

import { User } from '@winrepo/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refresh: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set, get) => ({
      user: {
        id: 'mock-admin',
        email: 'admin@winrepo.local',
        name: 'Admin User',
        role: 'super_admin'
      } as any,
      isAuthenticated: true,
      isLoading: false,
      
      login: (token, refresh, user) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },
      
      logout: async () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      
      checkAuth: async () => {
        const mockUser = {
          id: 'mock-admin',
          email: 'admin@winrepo.local',
          name: 'Admin User',
          role: 'super_admin'
        };
        set({ user: mockUser as any, isAuthenticated: true, isLoading: false });
      },
}));
