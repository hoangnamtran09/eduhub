import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

    // Lấy semester đầu tiên của subject này
    const semester = await prisma.semester.findFirst({
      where: { subjectId },
      orderBy: { order: 'asc' }
    });
    if (!semester) {
      return NextResponse.json(
        { error: "Không tìm thấy học kỳ cho môn học này" },
        { status: 400 }
      );
    }

    // Create or find default course for this subject (theo semester)
    let course = await prisma.course.findFirst({
      where: { subjectId, semesterId: semester.id }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          subjectId,
          semesterId: semester.id,
          title: "Khóa học mới",
          slug: `course-${subjectId}-${Date.now()}`,
          gradeLevel: 6,
          isPublished: true
        }
      });
    }

    // Lấy tất cả semesterId thuộc subject này
    const semesters = await prisma.semester.findMany({ where: { subjectId } });
    const semesterIds = semesters.map(s => s.id);
    // Xóa toàn bộ lesson cũ thuộc các semester này
    await prisma.lesson.deleteMany({
      where: { semesterId: { in: semesterIds } }
    });

    // Tạo lesson mới, gán vào semester đầu tiên của subject
    let totalLessons = 0;
    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
      const chapter = chapters[chapterIdx];
      for (let lessonIdx = 0; lessonIdx < chapter.lessons.length; lessonIdx++) {
        const lesson = chapter.lessons[lessonIdx];
        await prisma.lesson.create({
          data: {
            semesterId: semester.id,
            title: lesson.title,
            content: lesson.content,
            order: lessonIdx + 1,
            duration: 30, // Default 30 minutes
            type: lesson.type,
            pdfUrl: lesson.pdfUrl ?? undefined,
            // Có thể thêm trường chapter nếu muốn lưu tên chương
          }
        });
        totalLessons++;
      }
    }

    return NextResponse.json({
      success: true,
      courseId: course.id,
      totalChapters: chapters.length,
      totalLessons
    });

  } catch (error) {
    console.error("Save lessons error:", error);
    return NextResponse.json(
      { error: "Failed to save lessons" },
      { status: 500 }
    );
  }
}