import { create } from 'zustand';

interface AdminUser { id: number; name: string; email: string; role: string; }

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** true setelah sesi dari localStorage selesai dibaca (mencegah redirect palsu saat refresh) */
  hydrated: boolean;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<AdminUser>) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  login: (user, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, hydrated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null, isAuthenticated: false, hydrated: true });
  },

  updateUser: (patch) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...patch };
      localStorage.setItem('admin_user', JSON.stringify(user));
      return { user };
    });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('admin_token');
    const raw = localStorage.getItem('admin_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw);
        set({ user, token, isAuthenticated: true, hydrated: true });
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        set({ user: null, token: null, isAuthenticated: false, hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },
}));
