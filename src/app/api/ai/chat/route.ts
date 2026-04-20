import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getTutorPrompt } from "@/lib/ai/prompts";

interface ChatRequest {
  messages: { role: string; content: string }[];
  lessonId?: string;
  subjectId?: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, lessonId, subjectId, model } = body;

    let lessonTitle = "";
    let subjectName = "";
    let gradeLevel = 0;
    let lessonContent = "";

    // @ts-ignore - Bypass Prisma type sync issues
    const prismaAny = prisma as any;

    // Ưu tiên lấy lessonId, nếu không có thì lấy subjectId
    if (lessonId) {
      const lesson = await prismaAny.lesson.findUnique({
        where: { id: lessonId },
        include: { 
          subject: true,
        },
      });
      if (lesson) {
        lessonTitle = lesson.title || "";
        subjectName = lesson.subject?.name || "";
        // Lấy gradeLevel từ course liên quan hoặc mặc định
        const course = await prismaAny.course.findFirst({
          where: { subjectId: lesson.subjectId || lesson.subject?.id }
        });
        gradeLevel = course?.gradeLevel || 6;
        lessonContent = lesson.content || "";
      }
    } else if (subjectId) {
      const subject = await prismaAny.subject.findUnique({ 
        where: { id: subjectId },
      });
      if (subject) {
        subjectName = subject.name;
        const course = await prismaAny.course.findFirst({
          where: { subjectId: subject.id }
        });
        gradeLevel = course?.gradeLevel || 6;
      }
    }

    // Sử dụng prompt đã được tối ưu
    const systemPrompt = getTutorPrompt(
      lessonTitle || "Chung",
      subjectName || "Kiến thức tổng hợp",
      gradeLevel,
      lessonContent
    );

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Gọi Beeknoee AI
    const assistantMessage = await chatWithAI(allMessages);
    return NextResponse.json({ message: assistantMessage, model: "beeknoee" });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
