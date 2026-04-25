import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const assignments = await prismaAny.assignment.findMany({
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        recipients: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                gradeLevel: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const body = await request.json();
    const {
      title,
      description,
      pdfUrl,
      pdfStorageKey,
      lessonId,
      dueDate,
      maxScore,
      rubric,
      targetGradeLevel,
      studentIds,
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Missing title or description" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    const normalizedStudentIds = Array.isArray(studentIds)
      ? studentIds.filter((value: unknown) => typeof value === "string" && value)
      : [];

    let recipients: string[] = normalizedStudentIds;

    if (!recipients.length && targetGradeLevel) {
      const gradeStudents = await prismaAny.user.findMany({
        where: {
          role: "STUDENT",
          gradeLevel: Number(targetGradeLevel),
        },
        select: {
          id: true,
        },
      });
      recipients = gradeStudents.map((student: { id: string }) => student.id);
    }

    if (!recipients.length) {
      return NextResponse.json({ error: "No recipients selected" }, { status: 400 });
    }

    const assignment = await prismaAny.assignment.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        pdfUrl: typeof pdfUrl === "string" && pdfUrl ? pdfUrl : null,
        pdfStorageKey: typeof pdfStorageKey === "string" && pdfStorageKey ? pdfStorageKey : null,
        lessonId: lessonId || null,
        createdById: authorization.authUser.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: Number(maxScore) > 0 ? Number(maxScore) : 10,
        rubric: Array.isArray(rubric) ? rubric : undefined,
        targetGradeLevel: targetGradeLevel ? Number(targetGradeLevel) : null,
        recipients: {
          create: recipients.map((studentId: string) => ({
            studentId,
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
