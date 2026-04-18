import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// GET /api/admin/subjects - Lấy danh sách tất cả môn học
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        semesters: {
          include: {
            lessons: true,
            courses: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const subjectsWithStats = subjects.map((subject) => {
      const totalLessons = subject.semesters.reduce(
        (acc, sem) => acc + sem.lessons.length,
        0
      );
      const totalSemesters = subject.semesters.length;

      return {
        ...subject,
        totalLessons,
        totalSemesters,
      };
    });

    return NextResponse.json(subjectsWithStats);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

// POST /api/admin/subjects - Tạo môn học mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const subject = await prisma.subject.create({
      data: {
        name,
        slug: `${slug}-${Date.now()}`,
        description,
        icon,
        color,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subjects - Cập nhật môn học
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, icon, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        color,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subjects - Xóa môn học
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}