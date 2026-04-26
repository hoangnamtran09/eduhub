import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/get-auth-user", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { PATCH } from "@/app/api/settings/notifications/route";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";

const getAuthUserMock = vi.mocked(getAuthUser);
const prismaMock = prisma as unknown as {
  user: {
    update: ReturnType<typeof vi.fn>;
  };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/settings/notifications", () => {
  it("returns 401 when user is not authenticated", async () => {
    getAuthUserMock.mockResolvedValue(null);

    const response = await PATCH(new Request("http://localhost/api/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify({
        dailyStudyReminder: true,
        newAssignmentNotification: true,
        weeklyEmailReport: false,
      }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid payload", async () => {
    getAuthUserMock.mockResolvedValue({ userId: "user-1", role: "STUDENT", email: "student@example.com" });

    const response = await PATCH(new Request("http://localhost/api/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify({
        dailyStudyReminder: "yes",
        newAssignmentNotification: true,
        weeklyEmailReport: false,
      }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Expected boolean, received string" });
  });

  it("updates notification preferences and returns sanitized user payload", async () => {
    getAuthUserMock.mockResolvedValue({ userId: "user-1", role: "STUDENT", email: "student@example.com" });
    prismaMock.user.update.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      role: "STUDENT",
      diamonds: 0,
      dailyStudyReminder: false,
      newAssignmentNotification: true,
      weeklyEmailReport: true,
      passwordHash: "secret",
      profile: { id: "profile-1", userId: "user-1", goals: [], strengths: [], weaknesses: [], streakDays: 0, lastActive: null },
    });

    const response = await PATCH(new Request("http://localhost/api/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify({
        dailyStudyReminder: false,
        newAssignmentNotification: true,
        weeklyEmailReport: true,
      }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        dailyStudyReminder: false,
        newAssignmentNotification: true,
        weeklyEmailReport: true,
      },
      include: { profile: true },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        email: "student@example.com",
        role: "STUDENT",
        diamonds: 0,
        dailyStudyReminder: false,
        newAssignmentNotification: true,
        weeklyEmailReport: true,
        profile: { id: "profile-1", userId: "user-1", goals: [], strengths: [], weaknesses: [], streakDays: 0, lastActive: null },
      },
    });
  });
});
