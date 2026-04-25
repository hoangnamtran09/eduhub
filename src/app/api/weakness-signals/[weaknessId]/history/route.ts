import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

type RouteParams = { params: { weaknessId: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weakness = await prismaAny.lessonWeakness.findUnique({
      where: { id: params.weaknessId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!weakness || weakness.userId !== authUser.userId) {
      return NextResponse.json({ error: "Weakness not found" }, { status: 404 });
    }

    const attempts = await prismaAny.remediationAttempt.findMany({
      where: { weaknessId: params.weaknessId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        passed: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      weakness: {
        id: weakness.id,
        topic: weakness.topic,
        status: weakness.status,
        initialScore: weakness.initialScore,
        bestScore: weakness.bestScore,
        remediationCount: weakness.remediationCount,
        evidenceCount: weakness.evidenceCount,
        score: weakness.score,
        reason: weakness.reason,
        aiFeedback: weakness.aiFeedback,
        lessonTitle: weakness.lesson?.title || null,
        subjectName: weakness.lesson?.subject?.name || null,
        createdAt: weakness.createdAt,
        remediatedAt: weakness.remediatedAt,
      },
      attempts,
    });
  } catch (error) {
    console.error("Weakness history error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
