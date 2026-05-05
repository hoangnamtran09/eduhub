import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-role";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTeacherSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120),
});

const updateTeacherSchema = z.object({
  id: z.string().min(1),
  email: z.string().trim().email(),
  fullName: z.string().trim().max(120).optional().nullable(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
});

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const teachers = await prismaAny.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        teacherStudents: {
          select: { id: true, fullName: true, email: true, gradeLevel: true },
        },
        createdAssignments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = teachers.map((teacher: any) => ({
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.fullName,
      createdAt: teacher.createdAt,
      studentCount: teacher.teacherStudents.length,
      assignmentCount: teacher.createdAssignments.length,
      students: teacher.teacherStudents,
    }));

    return NextResponse.json({ teachers: result });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = createTeacherSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid teacher payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const prismaAny = prisma as any;

    const passwordHash = await hashPassword(password);

    const teacher = await prismaAny.user.create({
      data: {
        email: email.trim(),
        fullName: fullName.trim(),
        role: "TEACHER",
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { teacher: { ...teacher, studentCount: 0, assignmentCount: 0, students: [] } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = updateTeacherSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid teacher payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, email, fullName, password } = parsed.data;
    const prismaAny = prisma as any;

    const data: any = {
      email: email.trim(),
      fullName: fullName?.trim() || null,
    };

    if (password && password.trim()) {
      data.passwordHash = await hashPassword(password.trim());
    }

    const teacher = await prismaAny.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        teacherStudents: {
          select: { id: true, fullName: true, email: true, gradeLevel: true },
        },
        createdAssignments: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        email: teacher.email,
        fullName: teacher.fullName,
        createdAt: teacher.createdAt,
        studentCount: teacher.teacherStudents.length,
        assignmentCount: teacher.createdAssignments.length,
        students: teacher.teacherStudents,
      },
    });
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing teacher id" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    await prismaAny.user.updateMany({
      where: { teacherId: id },
      data: { teacherId: null },
    });

    await prismaAny.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
