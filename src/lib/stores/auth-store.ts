import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
  } | null;
  isReady: boolean;
  setReady: (ready: boolean) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isReady: false,
      setReady: (ready) => set({ isReady: ready }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-store',
    },
  ),
);
