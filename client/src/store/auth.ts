// client/src/store/auth.ts
import { create } from 'zustand';
import { api } from '../api/client';
import type { AuthResponse, User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async login(email, password) {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, loading: false });    // ← التعديل
  },

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.clear();
    set({ user: null, loading: false });         // ← التعديل
  },

  async loadUser() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const { data } = await api.get<User>('/auth/me');
        set({ user: data, loading: false });
      } catch {
        localStorage.clear();
        set({ user: null, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },
}));

export const useAuthStore = useAuth;             // alias (من تعديل سابق)