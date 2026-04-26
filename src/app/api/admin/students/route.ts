import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateStudentSchema = z.object({
  id: z.string().min(1),
  email: z.string().trim().email(),
  fullName: z.string().trim().max(120).optional().nullable(),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  diamonds: z.coerce.number().int().min(0).max(1_000_000).optional(),
  parentId: z.string().trim().optional().nullable(),
  goals: z.array(z.string().trim().min(1).max(120)).optional(),
  strengths: z.array(z.string().trim().min(1).max(120)).optional(),
  weaknesses: z.array(z.string().trim().min(1).max(120)).optional(),
});

const createStudentSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  parentId: z.string().trim().optional().nullable(),
  createParent: z.boolean().optional(),
  parentEmail: z.string().trim().email().optional().or(z.literal("")),
  parentPassword: z.string().min(8).max(128).optional().or(z.literal("")),
  parentFullName: z.string().trim().max(120).optional().nullable(),
  goals: z.array(z.string().trim().min(1).max(120)).optional(),
  strengths: z.array(z.string().trim().min(1).max(120)).optional(),
  weaknesses: z.array(z.string().trim().min(1).max(120)).optional(),
});

export async function GET() {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const [students, parents] = await Promise.all([
      prismaAny.user.findMany({
        where: { role: "STUDENT" },
        include: {
          parent: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          profile: true,
          studySessions: {
            select: {
              durationSec: true,
            },
          },
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prismaAny.user.findMany({
        where: { role: "PARENT" },
        select: {
          id: true,
          email: true,
          fullName: true,
          children: {
            where: { role: "STUDENT" },
            select: {
              id: true,
            },
          },
        },
        orderBy: [{ fullName: "asc" }, { email: "asc" }],
      }),
    ]);

    return NextResponse.json({ students, parents });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = createStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid student payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      email,
      password,
      fullName,
      gradeLevel,
      parentId,
      createParent,
      parentEmail,
      parentPassword,
      parentFullName,
      goals,
      strengths,
      weaknesses,
    } = parsed.data;
    const prismaAny = prisma as any;
    let normalizedParentId = parentId?.trim() || null;

    if (createParent) {
      if (!parentEmail?.trim() || !parentPassword) {
        return NextResponse.json(
          { error: "Missing parent email or password" },
          { status: 400 },
        );
      }

      normalizedParentId = null;
    }

    if (normalizedParentId) {
      const parentAccount = await prismaAny.user.findFirst({
        where: {
          id: normalizedParentId,
          role: "PARENT",
        },
        select: { id: true },
      });

      if (!parentAccount) {
        return NextResponse.json({ error: "Parent account not found" }, { status: 404 });
      }
    }

    const studentPasswordHash = await hashPassword(password);
    const parentPasswordHash = createParent && parentPassword ? await hashPassword(parentPassword) : null;

    const student = await prismaAny.$transaction(async (tx: any) => {
      let createdParent: any = null;

      if (createParent && parentEmail?.trim() && parentPasswordHash) {
        createdParent = await tx.user.create({
          data: {
            email: parentEmail.trim(),
            fullName: parentFullName?.trim() || null,
            role: "PARENT",
            passwordHash: parentPasswordHash,
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            children: {
              where: { role: "STUDENT" },
              select: { id: true },
            },
          },
        });
        normalizedParentId = createdParent.id;
      }

      const createdStudent = await tx.user.create({
        data: {
          email: email.trim(),
          fullName: fullName.trim(),
          role: "STUDENT",
          gradeLevel,
          parentId: normalizedParentId,
          passwordHash: studentPasswordHash,
          profile: {
            create: {
              goals: Array.isArray(goals) ? goals : [],
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
            },
          },
        },
        include: {
          parent: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          profile: true,
          studySessions: {
            select: {
              durationSec: true,
            },
          },
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      return { ...createdStudent, createdParent };
    });

    const { createdParent, ...createdStudent } = student;

    return NextResponse.json(
      createdParent ? { student: createdStudent, parent: createdParent } : createdStudent,
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating student:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = updateStudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid student payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { id, email, fullName, gradeLevel, diamonds, parentId, goals, strengths, weaknesses } = parsed.data;

    if (!id || !email.trim()) {
      return NextResponse.json({ error: "Missing student id or email" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    const normalizedParentId = parentId?.trim() || null;

    if (normalizedParentId) {
      const parentAccount = await prismaAny.user.findFirst({
        where: {
          id: normalizedParentId,
          role: "PARENT",
        },
        select: { id: true },
      });

      if (!parentAccount) {
        return NextResponse.json({ error: "Parent account not found" }, { status: 404 });
      }
    }

    const updatedStudent = await prismaAny.user.update({
      where: { id },
      data: {
        email: email.trim(),
        fullName: fullName?.trim() || null,
        gradeLevel: gradeLevel ? Number(gradeLevel) : null,
        diamonds: Number.isFinite(Number(diamonds)) ? Number(diamonds) : 0,
        parentId: normalizedParentId,
        profile: {
          upsert: {
            create: {
              goals: Array.isArray(goals) ? goals : [],
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
            },
            update: {
              goals: Array.isArray(goals) ? goals : [],
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
            },
          },
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        profile: true,
        studySessions: {
          select: {
            durationSec: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error("Error updating student:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing student id" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    await prismaAny.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
