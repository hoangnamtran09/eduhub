import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

interface RouteParams {
  params: { sessionId: string };
}

async function updateStudySession(request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seconds = 0, ended = false } = await request.json();
    const extraSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

    const prismaAny = prisma as any;
    const existing = await prismaAny.studySession.findUnique({
      where: { id: params.sessionId },
    });

    if (!existing || existing.userId !== authUser.userId) {
      return NextResponse.json({ error: "Study session not found" }, { status: 404 });
    }

    const updated = await prismaAny.studySession.update({
      where: { id: params.sessionId },
      data: {
        durationSec: (existing.durationSec || 0) + extraSeconds,
        lastPingAt: new Date(),
        endedAt: ended ? new Date() : existing.endedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update study session error:", error);
    return NextResponse.json({ error: "Failed to update study session" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  return updateStudySession(request, context);
}

export async function POST(request: Request, context: RouteParams) {
  return updateStudySession(request, context);
}
