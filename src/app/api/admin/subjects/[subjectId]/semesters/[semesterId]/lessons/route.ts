import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// GET /api/admin/subjects/[subjectId]/semesters/[semesterId]/lessons - Lấy danh sách bài học
export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string; semesterId: string }> }
) {
  const { semesterId } = await params;
  try {
    const lessons = await prisma.lesson.findMany({
      where: { semesterId },
      include: {
        quizzes: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/subjects/[subjectId]/semesters/[semesterId]/lessons - Tạo bài học mới
export async function POST(
  request: Request,
  { params }: { params: Promise<{ subjectId: string; semesterId: string }> }
) {
  const { semesterId } = await params;
  try {
    const body = await request.json();
    const { title, content, videoUrl, duration, type, order } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get max order if not provided
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const maxOrderLesson = await prisma.lesson.findFirst({
        where: { semesterId },
        orderBy: { order: "desc" },
      });
      lessonOrder = (maxOrderLesson?.order ?? -1) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        semesterId,
        title,
        content: content || "",
        videoUrl,
        duration: duration || null,
        type: type || "theory",
        order: lessonOrder,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subjects/[subjectId]/semesters/[semesterId]/lessons - Cập nhật bài học
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ subjectId: string; semesterId: string }> }
) {
  try {
    const body = await request.json();
    const { id, title, content, videoUrl, duration, type, order, isPublished, pdfUrl } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        content,
        videoUrl,
        duration,
        type,
        order,
        isPublished,
        pdfUrl,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subjects/[subjectId]/semesters/[semesterId]/lessons - Xóa bài học
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subjectId: string; semesterId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
