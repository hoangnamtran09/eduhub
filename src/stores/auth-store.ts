import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/types";

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Changes whenever a local authentication action supersedes an in-flight restore. */
  authVersion: number;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authVersion: 0,

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          authVersion: state.authVersion + 1,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set((state) => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          authVersion: state.authVersion + 1,
        })),
    }),
    {
      name: "eduhub-auth",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return noopStorage;
        }

        return window.localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
