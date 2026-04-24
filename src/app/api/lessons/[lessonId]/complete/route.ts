import { NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { getCompletionQuizPrompt } from "@/lib/ai/prompts";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { completeLessonProgress } from "@/lib/learning-state";
import { normalizeCompletionQuizQuestions, toPublicCompletionQuiz } from "@/lib/learning/completion-quiz";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const QUESTION_COUNT = 3;

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

    const rateLimitResponse = checkRateLimit(`lesson-complete:${authUser.userId}:${getClientIp(request)}`, 6, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const extraSeconds = Math.max(0, Math.floor(Number(body.seconds) || 0));
    const prismaAny = prisma as any;

    const lesson = await prismaAny.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        subject: true,
        Chapter: {
          include: {
            Course: true,
          },
        },
        quizzes: {
          where: { title: "Đánh giá ghi nhớ cuối phiên" },
          include: { questions: { orderBy: { order: "asc" } } },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    await completeLessonProgress(authUser.userId, lesson.id, extraSeconds);

    const existingQuiz = lesson.quizzes?.[0];
    if (existingQuiz?.questions?.length) {
      return NextResponse.json({
        completed: true,
        quiz: toPublicCompletionQuiz(existingQuiz),
      });
    }

    const prompt = getCompletionQuizPrompt({
      lessonTitle: lesson.title || "Bài học",
      subjectName: lesson.subject?.name || "Kiến thức tổng hợp",
      gradeLevel: lesson.Chapter?.Course?.gradeLevel || 10,
      lessonContent: String(lesson.content || "").slice(0, 12_000),
      questionCount: QUESTION_COUNT,
    });

    const response = await chatWithAI([
      { role: "system", content: prompt },
      { role: "user", content: "Tạo quiz đánh giá ghi nhớ cuối phiên theo đúng JSON đã yêu cầu." },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    const questions = normalizeCompletionQuizQuestions(parsed, QUESTION_COUNT);

    if (!questions.length) {
      return NextResponse.json({
        completed: true,
        quiz: null,
        warning: "Không tạo được quiz đánh giá từ AI",
      });
    }

    const quiz = await prismaAny.quiz.create({
      data: {
        lessonId: lesson.id,
        title: "Đánh giá ghi nhớ cuối phiên",
        questions: {
          create: questions.map((question, index) => ({
            question: question.question,
            options: question.options,
            explanation: question.explanation || null,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({
      completed: true,
      quiz: toPublicCompletionQuiz(quiz),
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 });
  }
}
