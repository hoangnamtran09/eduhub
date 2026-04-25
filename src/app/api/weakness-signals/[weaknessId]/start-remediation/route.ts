import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";
import { chatWithAI } from "@/lib/beeknoee/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

type RouteParams = { params: { weaknessId: string } };

function parseJsonArray(value: string) {
  const match = value.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function generateRemediationQuiz(input: {
  topic: string;
  lessonTitle: string;
  subjectName: string;
  reason: string;
  existingExercises: unknown;
}) {
  const existingContext = Array.isArray(input.existingExercises) && input.existingExercises.length
    ? `\nCác bài ôn đã có (tránh trùng): ${JSON.stringify(input.existingExercises.map((e: any) => e.question).slice(0, 3))}`
    : "";

  const response = await chatWithAI([
    {
      role: "system",
      content: `Bạn là giáo viên tạo bài kiểm tra ôn tập cho LMS. Tạo ĐÚNG 5 câu trắc nghiệm ôn lại chủ đề yếu. Trả về JSON array hợp lệ, không markdown.

Mỗi câu có format:
{"question":"Câu hỏi","options":["A","B","C","D"],"correctIndex":0,"hint":"Gợi ý ngắn","explanation":"Giải thích đáp án đúng"}

correctIndex là index 0-3 của đáp án đúng trong mảng options.
Câu hỏi phải bám sát chủ đề, có tính ứng dụng, tăng dần độ khó.`,
    },
    {
      role: "user",
      content: `Chủ đề yếu: ${input.topic}
Bài học: ${input.lessonTitle}
Môn: ${input.subjectName}
Lý do yếu: ${input.reason}${existingContext}

Hãy tạo 5 câu trắc nghiệm ôn tập.`,
    },
  ]);

  const parsed = parseJsonArray(response);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI did not return valid quiz array");
  }

  return parsed.slice(0, 5).map((item: any, idx: number) => ({
    id: `q${idx}`,
    question: typeof item?.question === "string" ? item.question : `Câu ${idx + 1}`,
    options: Array.isArray(item?.options) ? item.options.filter((o: unknown) => typeof o === "string").slice(0, 4) : ["A", "B", "C", "D"],
    correctIndex: typeof item?.correctIndex === "number" && item.correctIndex >= 0 && item.correctIndex <= 3 ? item.correctIndex : 0,
    hint: typeof item?.hint === "string" ? item.hint : "",
    explanation: typeof item?.explanation === "string" ? item.explanation : "",
  }));
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weakness = await prismaAny.lessonWeakness.findUnique({
      where: { id: params.weaknessId },
      include: {
        lesson: {
          include: { subject: true },
        },
      },
    });

    if (!weakness || weakness.userId !== authUser.userId) {
      return NextResponse.json({ error: "Weakness not found" }, { status: 404 });
    }

    const quizData = await generateRemediationQuiz({
      topic: weakness.topic,
      lessonTitle: weakness.lesson?.title || "Bài học",
      subjectName: weakness.lesson?.subject?.name || weakness.topic,
      reason: weakness.reason,
      existingExercises: weakness.reviewExercises,
    });

    const attempt = await prismaAny.remediationAttempt.create({
      data: {
        weaknessId: weakness.id,
        userId: authUser.userId,
        quizData,
        totalQuestions: quizData.length,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      weaknessId: weakness.id,
      topic: weakness.topic,
      lessonTitle: weakness.lesson?.title || null,
      questions: quizData.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        hint: q.hint,
      })),
    });
  } catch (error) {
    console.error("Start remediation error:", error);
    return NextResponse.json({ error: "Failed to start remediation" }, { status: 500 });
  }
}
