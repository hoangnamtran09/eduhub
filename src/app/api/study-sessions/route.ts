import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

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
    const session = await prismaAny.studySession.create({
      data: {
        userId: authUser.userId,
        lessonId,
        startedAt: new Date(),
        lastPingAt: new Date(),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Create study session error:", error);
    return NextResponse.json({ error: "Failed to create study session" }, { status: 500 });
  }
}
