import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

interface RouteParams {
  params: { lessonId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { lessonId } = params;
    console.log("Fetching lesson with ID:", lessonId);

    // Use any to bypass Prisma type sync issues in the environment
    const prismaAny = prisma as any;

    const lesson = await prismaAny.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      console.log("Lesson not found:", lessonId);
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Fetch subject and related lessons separately to be more robust
    let subject = null;
    let allLessons: any[] = [];
    
    try {
      subject = await prismaAny.subject.findUnique({
        where: { id: lesson.subjectId },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      });
      allLessons = subject?.lessons || [];
    } catch (subjectError) {
      console.error("Error fetching subject for lesson:", subjectError);
    }

    const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const response = {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration || 0,
      order: lesson.order,
      pdfUrl: lesson.pdfUrl,
      chapter: null, // Simplified for now
      subject: subject ? {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
      } : null,
      chapterLessons: allLessons.map((l: any) => ({
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
