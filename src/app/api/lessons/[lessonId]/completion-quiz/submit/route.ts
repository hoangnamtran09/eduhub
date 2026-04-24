import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";
import { getLearningInsights } from "@/lib/learning-insights";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { CompletionQuizOption } from "@/lib/learning/completion-quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimitResponse = checkRateLimit(`completion-quiz:${authUser.userId}:${getClientIp(request)}`, 12, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const quizId = typeof body.quizId === "string" ? body.quizId : "";
    const answers = body.answers && typeof body.answers === "object" ? body.answers as Record<string, string> : {};

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const quiz = await prismaAny.quiz.findFirst({
      where: {
        id: quizId,
        lessonId: params.lessonId,
      },
      include: {
        lesson: { include: { subject: true } },
        questions: { orderBy: { order: "asc" } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questionResults = (quiz.questions || []).map((question: any) => {
      const options = Array.isArray(question.options) ? question.options as CompletionQuizOption[] : [];
      const selectedOptionIndex = Number(answers[question.id]);
      const correctOptionIndex = options.findIndex((option) => option.isCorrect);
      const isCorrect = selectedOptionIndex === correctOptionIndex;

      return {
        questionId: question.id,
        question: question.question,
        selectedOptionIndex: Number.isInteger(selectedOptionIndex) ? selectedOptionIndex : null,
        selectedOptionText: Number.isInteger(selectedOptionIndex) ? options[selectedOptionIndex]?.text ?? null : null,
        correctOptionIndex,
        correctOptionText: options[correctOptionIndex]?.text ?? null,
        isCorrect,
        explanation: question.explanation || "",
      };
    });

    const correctCount = questionResults.filter((item: { isCorrect: boolean }) => item.isCorrect).length;

    const attempt = await prismaAny.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: authUser.userId,
        score: correctCount,
        totalQuestions: questionResults.length,
        answers: questionResults,
        completedAt: new Date(),
      },
    });

    if (correctCount < questionResults.length) {
      const weaknessTopic = quiz.lesson?.subject?.name || quiz.lesson?.title || "Bài học cần ôn lại";
      const existingProfile = await prismaAny.studentProfile.findUnique({
        where: { userId: authUser.userId },
      });
      const existingWeaknesses = Array.isArray(existingProfile?.weaknesses) ? existingProfile.weaknesses : [];

      await prismaAny.studentProfile.upsert({
        where: { userId: authUser.userId },
        create: {
          userId: authUser.userId,
          goals: [],
          strengths: [],
          weaknesses: [weaknessTopic],
          lastActive: new Date(),
        },
        update: {
          weaknesses: [weaknessTopic, ...existingWeaknesses.filter((item: string) => item !== weaknessTopic)].slice(0, 12),
          lastActive: new Date(),
        },
      }).catch((error: unknown) => {
        console.warn("Failed to update profile weakness from completion quiz:", error);
      });
    }

    const insights = await getLearningInsights(authUser.userId);

    return NextResponse.json({
      attemptId: attempt.id,
      score: correctCount,
      totalQuestions: questionResults.length,
      percentage: questionResults.length ? Math.round((correctCount / questionResults.length) * 100) : 0,
      results: questionResults,
      weaknesses: insights.weaknesses,
      roadmap: insights.roadmap,
    });
  } catch (error) {
    console.error("Submit completion quiz error:", error);
    return NextResponse.json({ error: "Failed to submit completion quiz" }, { status: 500 });
  }
}
