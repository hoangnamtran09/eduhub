import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getGraderPrompt } from "@/lib/ai/prompts";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = checkRateLimit(`ai-grade:${authUser.userId}:${getClientIp(request)}`, 20, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { lessonId, question, userAnswer } = body;

    if (!question || !userAnswer) {
      return NextResponse.json({ error: "Missing exercise content" }, { status: 400 });
    }

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
    }

    const systemPrompt = getGraderPrompt(String(question).slice(0, 4_000), String(userAnswer).slice(0, 4_000));
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hãy chấm điểm câu trả lời của tôi." }
    ];

    const response = await chatWithAI(messages);
    
    // Try to parse JSON from AI response
    let gradeData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback
      gradeData = {
        score: 50,
        feedback: response,
        isPassed: false,
        diamondsEarned: 0
      };
    }

    gradeData = {
      score: clampNumber(gradeData.score, 0, 100, 0),
      feedback: typeof gradeData.feedback === "string" ? gradeData.feedback : response,
      isPassed: Boolean(gradeData.isPassed),
      diamondsEarned: clampNumber(gradeData.diamondsEarned, 0, 10, 0),
    };

    try {
      await prisma.$transaction(async (tx) => {
        const diamondsEarned = gradeData.isPassed ? gradeData.diamondsEarned : 0;

        await tx.exerciseAttempt.create({
          data: {
            userId: authUser.userId,
            lessonId: lessonId || null,
            exerciseTitle: "Bài tập AI",
            question,
            userAnswer,
            aiFeedback: gradeData.feedback,
            score: gradeData.score,
            diamondsEarned,
          }
        });

        if (diamondsEarned > 0) {
          await tx.user.update({
            where: { id: authUser.userId },
            data: {
              diamonds: {
                increment: diamondsEarned
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("Failed to save exercise attempt or update diamonds:", error);
    }

    return NextResponse.json(gradeData);

  } catch (error) {
    console.error("Grade exercise error:", error);
    return NextResponse.json({ error: "Failed to grade exercise" }, { status: 500 });
  }
}
