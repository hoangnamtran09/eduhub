"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const authVersionAtStart = useAuthStore.getState().authVersion;
      setLoading(true);

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        // A successful login/logout may have completed while this initial
        // session restore was in flight. Do not overwrite that newer state.
        if (cancelled || useAuthStore.getState().authVersion !== authVersionAtStart) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (cancelled || useAuthStore.getState().authVersion !== authVersionAtStart) return;
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        if (!cancelled && useAuthStore.getState().authVersion === authVersionAtStart) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
