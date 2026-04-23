"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setLoading(!user);

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading, user]);

  return <>{children}</>;
}
