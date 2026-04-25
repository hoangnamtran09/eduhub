import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prismaAny = prisma as any;
const PASS_THRESHOLD = 70;

type RouteParams = { params: { weaknessId: string } };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const attemptId = body?.attemptId;
    const answers = body?.answers;

    if (!attemptId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing attemptId or answers" }, { status: 400 });
    }

    const attempt = await prismaAny.remediationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        weakness: {
          include: {
            lesson: { include: { subject: true } },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== authUser.userId || attempt.weaknessId !== params.weaknessId) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.completedAt) {
      return NextResponse.json({ error: "Attempt already completed" }, { status: 400 });
    }

    const quizData = Array.isArray(attempt.quizData) ? attempt.quizData : [];
    let correct = 0;

    const results = quizData.map((q: any, idx: number) => {
      const userAnswer = typeof answers[idx] === "number" ? answers[idx] : -1;
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        userAnswer,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation || "",
      };
    });

    const totalQuestions = quizData.length || 1;
    const scorePercent = Math.round((correct / totalQuestions) * 100);
    const passed = scorePercent >= PASS_THRESHOLD;

    await prismaAny.remediationAttempt.update({
      where: { id: attemptId },
      data: {
        answers: results,
        score: scorePercent,
        passed,
        completedAt: new Date(),
      },
    });

    const weakness = attempt.weakness;
    const currentInitial = weakness.initialScore ?? weakness.score ?? scorePercent;
    const currentBest = weakness.bestScore ?? 0;
    const newBest = Math.max(currentBest, scorePercent);
    const newStatus = passed ? "REMEDIATED" : "ACTIVE";

    await prismaAny.lessonWeakness.update({
      where: { id: params.weaknessId },
      data: {
        status: newStatus,
        lastResult: passed,
        initialScore: weakness.initialScore != null ? weakness.initialScore : currentInitial,
        bestScore: newBest,
        remediationCount: { increment: 1 },
        remediatedAt: passed ? new Date() : weakness.remediatedAt,
      },
    });

    return NextResponse.json({
      attemptId,
      score: scorePercent,
      correct,
      total: totalQuestions,
      passed,
      newStatus,
      initialScore: currentInitial,
      bestScore: newBest,
      results,
    });
  } catch (error) {
    console.error("Submit remediation error:", error);
    return NextResponse.json({ error: "Failed to submit remediation" }, { status: 500 });
  }
}
