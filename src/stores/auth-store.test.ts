import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

const storageMock = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const sampleUser: User = {
  id: "user-1",
  email: "student@example.com",
  fullName: "Student One",
  role: "STUDENT",
  diamonds: 12,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("useAuthStore", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      configurable: true,
      writable: true,
    });

    useAuthStore.setState({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });
  });

  it("marks the user as authenticated when setUser receives a user", () => {
    useAuthStore.getState().setUser(sampleUser);

    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("clears auth state on logout", () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("updates the loading flag independently", () => {
    useAuthStore.getState().setLoading(false);

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
