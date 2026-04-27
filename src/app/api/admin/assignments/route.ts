import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

interface CreateAssignmentBody {
  title?: string;
  description?: string;
  pdfUrl?: string;
  pdfStorageKey?: string;
  lessonId?: string | null;
  dueDate?: string | null;
  maxScore?: number;
  rubric?: Prisma.InputJsonValue;
  targetGradeLevel?: number | null;
  studentIds?: string[];
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const assignments = await prisma.assignment.findMany({
      where: authorization.authUser.role === "TEACHER"
        ? { createdById: authorization.authUser.userId }
        : undefined,
      select: {
        id: true,
        title: true,
        description: true,
        pdfUrl: true,
        pdfStorageKey: true,
        dueDate: true,
        maxScore: true,
        rubric: true,
        targetGradeLevel: true,
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
          select: {
            id: true,
            status: true,
            score: true,
            aiScore: true,
            submittedAt: true,
            reviewedAt: true,
            returnedAt: true,
            attemptCount: true,
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
    const body = await request.json() as CreateAssignmentBody;
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

    const normalizedStudentIds = Array.isArray(studentIds)
      ? studentIds.filter((value: unknown) => typeof value === "string" && value)
      : [];

    let recipients: string[] = normalizedStudentIds;

    if (!recipients.length && targetGradeLevel) {
      const gradeStudents = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          gradeLevel: Number(targetGradeLevel),
        },
        select: {
          id: true,
        },
      });
      recipients = gradeStudents.map((student) => student.id);
    }

    if (!recipients.length) {
      return NextResponse.json({ error: "No recipients selected" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
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
