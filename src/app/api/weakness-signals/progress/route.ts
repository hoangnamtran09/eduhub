import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weaknesses = await prismaAny.lessonWeakness.findMany({
      where: { userId: authUser.userId },
      select: {
        id: true,
        topic: true,
        status: true,
        initialScore: true,
        bestScore: true,
        remediationCount: true,
        createdAt: true,
        remediatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const attempts = await prismaAny.remediationAttempt.findMany({
      where: { userId: authUser.userId },
      select: {
        id: true,
        weaknessId: true,
        score: true,
        passed: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalWeaknesses = weaknesses.length;
    const activeCount = weaknesses.filter((w: any) => w.status !== "REMEDIATED").length;
    const remediatedCount = weaknesses.filter((w: any) => w.status === "REMEDIATED").length;
    const totalAttempts = attempts.filter((a: any) => a.completedAt).length;
    const passedAttempts = attempts.filter((a: any) => a.passed).length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.filter((a: any) => a.completedAt).reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAttempts)
      : 0;

    const timeline = attempts
      .filter((a: any) => a.completedAt)
      .slice(0, 20)
      .map((a: any) => ({
        id: a.id,
        weaknessId: a.weaknessId,
        score: a.score,
        passed: a.passed,
        completedAt: a.completedAt,
        topic: weaknesses.find((w: any) => w.id === a.weaknessId)?.topic || "Không rõ",
      }));

    const topicProgress = weaknesses.map((w: any) => ({
      id: w.id,
      topic: w.topic,
      status: w.status,
      initialScore: w.initialScore,
      bestScore: w.bestScore,
      remediationCount: w.remediationCount,
      createdAt: w.createdAt,
      remediatedAt: w.remediatedAt,
    }));

    return NextResponse.json({
      summary: {
        totalWeaknesses,
        activeCount,
        remediatedCount,
        totalAttempts,
        passedAttempts,
        avgScore,
        remediationRate: totalWeaknesses > 0 ? Math.round((remediatedCount / totalWeaknesses) * 100) : 0,
      },
      timeline,
      topicProgress,
    });
  } catch (error) {
    console.error("Weakness progress error:", error);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}
