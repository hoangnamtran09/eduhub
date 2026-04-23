import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiffInCalendarDays(current: Date, previous: Date) {
  const currentDay = startOfDay(current).getTime();
  const previousDay = startOfDay(previous).getTime();
  return Math.round((currentDay - previousDay) / (24 * 60 * 60 * 1000));
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await request.json();
    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const now = new Date();

    const session = await prismaAny.$transaction(async (tx: any) => {
      const existingProfile = await tx.studentProfile.findUnique({
        where: { userId: authUser.userId },
      });

      let nextStreakDays = 1;

      if (existingProfile?.lastActive) {
        const diffDays = dayDiffInCalendarDays(now, new Date(existingProfile.lastActive));

        if (diffDays <= 0) {
          nextStreakDays = existingProfile.streakDays || 1;
        } else if (diffDays === 1) {
          nextStreakDays = (existingProfile.streakDays || 0) + 1;
        }
      }

      await tx.studentProfile.upsert({
        where: { userId: authUser.userId },
        create: {
          userId: authUser.userId,
          goals: [],
          strengths: [],
          weaknesses: [],
          streakDays: 1,
          lastActive: now,
        },
        update: {
          streakDays: nextStreakDays,
          lastActive: now,
        },
      });

      return tx.studySession.create({
        data: {
          userId: authUser.userId,
          lessonId,
          startedAt: now,
          lastPingAt: now,
        },
      });
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Create study session error:", error);
    return NextResponse.json({ error: "Failed to create study session" }, { status: 500 });
  }
}
