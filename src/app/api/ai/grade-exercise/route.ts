import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getGraderPrompt } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, question, userAnswer, userId } = body;

    console.log("Grading exercise request:", { lessonId, userId });

    const systemPrompt = getGraderPrompt(question, userAnswer);
    
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

    // Save attempt and update diamonds if passed (only if userId is provided)
    if (userId) {
      try {
        await prisma.$transaction(async (tx) => {
          // Check if exerciseAttempt exists on tx (Prisma client)
          // Based on schema, it should be exerciseAttempt
          await tx.exerciseAttempt.create({
            data: {
              userId,
              lessonId,
              exerciseTitle: "Bài tập AI",
              question,
              userAnswer,
              aiFeedback: gradeData.feedback,
              score: gradeData.score,
              diamondsEarned: gradeData.isPassed ? (gradeData.diamondsEarned || 10) : 0,
            }
          });

          if (gradeData.isPassed) {
            await tx.user.update({
              where: { id: userId },
              data: {
                diamonds: {
                  increment: gradeData.diamondsEarned || 10
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("Failed to save exercise attempt or update diamonds:", error);
        // We still return the grade data even if saving fails
      }
    } else {
      console.warn("No userId provided, skipping reward and saving attempt.");
    }

    return NextResponse.json(gradeData);

  } catch (error) {
    console.error("Grade exercise error:", error);
    return NextResponse.json({ error: "Failed to grade exercise" }, { status: 500 });
  }
}
