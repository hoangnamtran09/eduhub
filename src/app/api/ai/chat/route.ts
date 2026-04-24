import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/beeknoee/client";
import { prisma } from "@/lib/prisma/client";
import { getTutorPrompt } from "@/lib/ai/prompts";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface ChatRequest {
  messages: { role: string; content: string }[];
  lessonId?: string;
  subjectId?: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = checkRateLimit(`ai-chat:${authUser.userId}:${getClientIp(request)}`, 30, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body: ChatRequest = await request.json();
    const { messages, lessonId, subjectId, model } = body;

    if (!Array.isArray(messages) || messages.length > 20) {
      return NextResponse.json({ error: "Invalid chat messages" }, { status: 400 });
    }

    const sanitizedMessages = messages
      .filter((message) => typeof message.content === "string" && message.content.trim())
      .slice(-20)
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content.trim().slice(0, 4_000),
      }));

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
      ...sanitizedMessages,
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
