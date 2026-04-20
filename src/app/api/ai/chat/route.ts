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

    // Ưu tiên lấy lessonId, nếu không có thì lấy subjectId
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { 
          semester: { 
            include: { 
              subject: true,
              courses: {
                take: 1
              }
            } 
          } 
        },
      });
      if (lesson) {
        lessonTitle = lesson.title || "";
        subjectName = lesson.semester?.subject?.name || "";
        gradeLevel = lesson.semester?.courses[0]?.gradeLevel || 0;
        lessonContent = lesson.content || "";
      }
    } else if (subjectId) {
      const subject = await prisma.subject.findUnique({ 
        where: { id: subjectId },
        include: {
          semesters: {
            include: {
              courses: {
                take: 1
              }
            },
            take: 1
          }
        }
      });
      if (subject) {
        subjectName = subject.name;
        gradeLevel = subject.semesters[0]?.courses[0]?.gradeLevel || 0;
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
