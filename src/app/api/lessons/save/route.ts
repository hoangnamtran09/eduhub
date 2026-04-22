import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "@/lib/slug";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

interface ParsedLesson {
  title: string;
  chapter: string;
  content: string;
  order: number;
  type: "theory" | "exercise" | "quiz";
  pdfUrl?: string;
}

interface ParsedChapter {
  id: string;
  title: string;
  lessons: ParsedLesson[];
}

interface SaveRequest {
  subjectId: string;
  chapters: ParsedChapter[];
  pdfUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { subjectId, chapters, pdfUrl } = body;

    if (!subjectId || !chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or find a default course for this subject.
    let course = await prisma.course.findFirst({
      where: { subjectId },
      orderBy: { createdAt: "asc" },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          subjectId,
          title: "Khóa học mới",
          slug: `course-${generateSlug(subjectId)}-${Date.now()}`,
          gradeLevel: 6,
          isPublished: true,
        },
      });
    }

    const existingChapters = await prisma.chapter.findMany({
      where: { courseId: course.id },
      select: { id: true },
    });

    await prisma.lesson.deleteMany({
      where: {
        chapterId: {
          in: existingChapters.map((chapter) => chapter.id),
        },
      },
    });

    await prisma.chapter.deleteMany({ where: { courseId: course.id } });

    let totalLessons = 0;
    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
      const chapter = chapters[chapterIdx];
      const createdChapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          title: chapter.title,
          order: chapterIdx + 1,
        },
      });

      for (let lessonIdx = 0; lessonIdx < chapter.lessons.length; lessonIdx++) {
        const lesson = chapter.lessons[lessonIdx];
        await prisma.lesson.create({
          data: {
            subjectId,
            chapterId: createdChapter.id,
            title: lesson.title,
            content: lesson.content,
            order: lessonIdx + 1,
            duration: 30, // Default 30 minutes
            type: lesson.type,
            pdfUrl: lesson.pdfUrl ?? undefined,
          },
        });
        totalLessons++;
      }
    }

    return NextResponse.json({
      success: true,
      courseId: course.id,
      totalChapters: chapters.length,
      totalLessons,
    });

  } catch (error) {
    console.error("Save lessons error:", error);
    return NextResponse.json(
      { error: "Failed to save lessons" },
      { status: 500 }
    );
  }
}
