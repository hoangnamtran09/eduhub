import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// GET /api/admin/subjects/[subjectId]/semesters - Lấy danh sách học kì
export async function GET(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const semesters = await prisma.semester.findMany({
      where: { subjectId: params.subjectId },
      include: {
        lessons: true,
        courses: true,
      },
      orderBy: { order: "asc" },
    });

    const semestersWithStats = semesters.map((sem) => ({
      ...sem,
      totalLessons: sem.lessons.length,
      totalCourses: sem.courses.length,
    }));

    return NextResponse.json(semestersWithStats);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    );
  }
}

// POST /api/admin/subjects/[subjectId]/semesters - Tạo học kì mới
export async function POST(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const body = await request.json();
    const { name, description, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const semester = await prisma.semester.create({
      data: {
        subjectId: params.subjectId,
        name,
        description,
        order: order || 1,
      },
    });

    return NextResponse.json(semester);
  } catch (error) {
    console.error("Error creating semester:", error);
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subjects/[subjectId]/semesters - Cập nhật học kì
export async function PUT(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const body = await request.json();
    const { id, name, description, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        name,
        description,
        order,
      },
    });

    return NextResponse.json(semester);
  } catch (error) {
    console.error("Error updating semester:", error);
    return NextResponse.json(
      { error: "Failed to update semester" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subjects/[subjectId]/semesters - Xóa học kì
export async function DELETE(
  request: Request,
  { params }: { params: { subjectId: string } }
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

    // Xóa toàn bộ chat history của các lesson thuộc semester này
    const lessons = await prisma.lesson.findMany({ where: { semesterId: id }, select: { id: true } });
    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length > 0) {
      await prisma.chatHistory.deleteMany({ where: { lessonId: { in: lessonIds } } });
    }
    await prisma.semester.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting semester:", error);
    return NextResponse.json(
      { error: "Failed to delete semester" },
      { status: 500 }
    );
  }
}