import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getLearningInsights, inferTopicFromText, normalizeTopic } from "@/lib/learning-insights";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prismaAny = prisma as any;

type WeaknessSignalBody = {
  topic?: string | null;
  question?: string | null;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  reason?: string | null;
  source?: "QUIZ" | "EXERCISE" | "PROFILE" | null;
  lessonId?: string | null;
  isResolved?: boolean | null;
  score?: number | null;
};

function parseJsonObject(value: string) {
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function generateWeaknessCoach(input: {
  lessonTitle: string;
  subjectName: string;
  topic: string;
  question?: string | null;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  reason: string;
  isResolved: boolean;
}) {
  try {
    const response = await chatWithAI([
      {
        role: "system",
        content: `Bạn là giáo viên phân tích lỗi sai cho LMS. Trả về JSON hợp lệ, không markdown. Nếu học sinh sai, hãy nhận xét ngắn và tạo 3 bài tập trắc nghiệm ôn lại liên quan đúng bài. Nếu học sinh trả lời ổn, vẫn ghi nhận điểm yếu đã khắc phục và gợi ý duy trì.

Output JSON:
{
  "aiFeedback": "Nhận xét ngắn gọn bằng tiếng Việt",
  "reviewExercises": [
    {
      "title":"Tên bài ôn",
      "question":"Câu hỏi trắc nghiệm ôn tập",
      "options":["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer":"Đáp án đúng",
      "hint":"Gợi ý ngắn"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Bài học: ${input.lessonTitle}
Môn: ${input.subjectName}
Chủ đề: ${input.topic}
Câu hỏi: ${input.question || "Không có"}
Câu trả lời học sinh: ${input.userAnswer || "Không có"}
Đáp án đúng/kỳ vọng: ${input.correctAnswer || "Không có"}
Lý do ghi nhận: ${input.reason}
Trạng thái: ${input.isResolved ? "đã khắc phục" : "đang yếu"}`,
      },
    ]);

    const parsed = parseJsonObject(response);
    const exercises = Array.isArray(parsed?.reviewExercises) ? parsed.reviewExercises : [];

    return {
      aiFeedback: typeof parsed?.aiFeedback === "string" ? parsed.aiFeedback : response.slice(0, 1_000),
      reviewExercises: exercises.slice(0, 3).map((item: any) => ({
        title: typeof item?.title === "string" ? item.title : "Bài ôn tập",
        question: typeof item?.question === "string" ? item.question : "Câu hỏi trắc nghiệm ôn lại kiến thức vừa sai là gì?",
        options: Array.isArray(item?.options) ? item.options.filter((option: unknown) => typeof option === "string").slice(0, 4) : [],
        correctAnswer: typeof item?.correctAnswer === "string" ? item.correctAnswer : "",
        hint: typeof item?.hint === "string" ? item.hint : "Xem lại phần lý thuyết trước khi trả lời.",
      })),
    };
  } catch (error) {
    console.warn("Failed to generate weakness coach feedback:", error);
    return {
      aiFeedback: input.isResolved
        ? "Bạn đã có dấu hiệu khắc phục điểm yếu này. Hãy duy trì bằng một lượt ôn ngắn."
        : "Bạn đang cần ôn lại phần này. Hãy xem lại bài học và làm thêm vài câu tương tự.",
      reviewExercises: [],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimitResponse = checkRateLimit(`weakness-signal:${authUser.userId}:${getClientIp(request)}`, 20, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = (await request.json()) as WeaknessSignalBody;
    const topic = normalizeTopic(body.topic) || inferTopicFromText(body.question);
    const source = body.source ?? "QUIZ";
    const isResolved = Boolean(body.isResolved);
    const reason = body.reason ?? (isResolved ? "Học sinh trả lời tốt sau khi ôn lại" : "Câu trả lời gần đây cho thấy chủ đề này cần ôn thêm");

    if (!topic || topic === "Tổng quan") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let lesson: any = null;
    if (body.lessonId) {
      lesson = await prismaAny.lesson.findUnique({
        where: { id: body.lessonId },
        include: { subject: true },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
    }

    const profile = await prismaAny.studentProfile.upsert({
      where: { userId: authUser.userId },
      update: {},
      create: {
        userId: authUser.userId,
        goals: [],
        strengths: [],
        weaknesses: [],
      },
    });

    const normalizedExisting = Array.isArray(profile.weaknesses)
      ? profile.weaknesses.map((item: string) => normalizeTopic(item)).filter(Boolean)
      : [];

    const dedupedWeaknesses = isResolved
      ? normalizedExisting
      : [topic, ...normalizedExisting.filter((item: string) => item !== topic)].slice(0, 12);

    await prismaAny.studentProfile.update({
      where: { userId: authUser.userId },
      data: {
        weaknesses: dedupedWeaknesses,
        lastActive: new Date(),
      },
    });

    let lessonWeakness = null;

    if (lesson) {
      const aiCoach = await generateWeaknessCoach({
        lessonTitle: lesson.title || "Bài học",
        subjectName: lesson.subject?.name || topic,
        topic,
        question: body.question,
        userAnswer: body.userAnswer,
        correctAnswer: body.correctAnswer,
        reason,
        isResolved,
      });

      try {
        lessonWeakness = await prismaAny.lessonWeakness.upsert({
          where: {
            userId_lessonId_topic: {
              userId: authUser.userId,
              lessonId: lesson.id,
              topic,
            },
          },
          create: {
            userId: authUser.userId,
            lessonId: lesson.id,
            topic,
            source,
            status: isResolved ? "REMEDIATED" : "ACTIVE",
            question: body.question || null,
            reason,
            aiFeedback: aiCoach.aiFeedback,
            reviewExercises: aiCoach.reviewExercises,
            score: typeof body.score === "number" ? body.score : null,
            lastResult: isResolved,
            remediatedAt: isResolved ? new Date() : null,
          },
          update: {
            source,
            status: isResolved ? "REMEDIATED" : "ACTIVE",
            question: body.question || null,
            reason,
            aiFeedback: aiCoach.aiFeedback,
            reviewExercises: aiCoach.reviewExercises,
            score: typeof body.score === "number" ? body.score : null,
            lastResult: isResolved,
            evidenceCount: { increment: 1 },
            remediatedAt: isResolved ? new Date() : null,
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                subjectId: true,
              },
            },
          },
        });
      } catch (error: any) {
        if (error?.code === "P2021" || error?.code === "P2022") {
          console.warn("LessonWeakness table is not available yet. Run Prisma migration/db push to enable lesson-level weaknesses.");
        } else {
          throw error;
        }
      }
    }

    const insights = await getLearningInsights(authUser.userId);

    return NextResponse.json({
      success: true,
      topic,
      source,
      reason,
      lessonWeakness,
      generatedAt: insights.generatedAt,
      weaknesses: insights.weaknesses,
      roadmap: insights.roadmap,
      mistakes: insights.mistakes,
    });
  } catch (error) {
    console.error("Weakness signal error:", error);
    return NextResponse.json({ error: "Failed to record weakness signal" }, { status: 500 });
  }
}
