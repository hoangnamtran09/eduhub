import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getExercisePrompt } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, subjectId } = body;

    let gradeLevel = 10; // Default
    let lessonContent = "";

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          Chapter: {
            include: {
              Course: true,
            },
          },
        },
      });
      if (lesson) {
        gradeLevel = lesson.Chapter?.Course.gradeLevel || 10;
        lessonContent = lesson.content || "";
      }
    }

    const systemPrompt = getExercisePrompt(gradeLevel);
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Dựa trên nội dung sau, hãy tạo 1 bài tập: \n\n${lessonContent}` }
    ];

    const response = await chatWithAI(messages);
    
    // Try to parse JSON from AI response
    let exerciseData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        exerciseData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      exerciseData = {
        type: "exercise",
        title: "Bài tập củng cố",
        question: response,
        hint: "Đọc kỹ nội dung bài học để trả lời nhé!"
      };
    }

    return NextResponse.json(exerciseData);
  } catch (error) {
    console.error("Generate exercise error:", error);
    return NextResponse.json({ error: "Failed to generate exercise" }, { status: 500 });
  }
}
