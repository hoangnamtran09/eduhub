import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

interface RouteParams {
  params: { lessonId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { lessonId } = params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        semester: {
          include: {
            subject: true,
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Get all lessons in semester for navigation
    const allLessons = await prisma.lesson.findMany({
      where: {
        semesterId: lesson.semesterId,
      },
      orderBy: { order: "asc" },
    });

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const response = {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration || 0,
      order: lesson.order,
      pdfUrl: lesson.pdfUrl,
      semester: {
        id: lesson.semester.id,
        title: lesson.semester.name,
        order: lesson.semester.order,
      },
      subject: {
        id: lesson.semester.subject.id,
        name: lesson.semester.subject.name,
        icon: lesson.semester.subject.icon,
        color: lesson.semester.subject.color,
      },
      chapterLessons: lesson.semester.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        duration: l.duration,
        isCurrent: l.id === lessonId,
      })),
      navigation: {
        prev: prevLesson
          ? {
              id: prevLesson.id,
              title: prevLesson.title,
              chapter: prevLesson.title,
            }
          : null,
        next: nextLesson
          ? {
              id: nextLesson.id,
              title: nextLesson.title,
              chapter: nextLesson.title,
            }
          : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}
