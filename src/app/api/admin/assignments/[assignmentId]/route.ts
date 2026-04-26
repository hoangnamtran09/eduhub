import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

interface RouteParams {
  params: { assignmentId: string };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const assignment = await prismaAny.assignment.findUnique({
      where: { id: params.assignmentId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
          },
        },
        recipients: {
          include: {
            feedbackEvents: { orderBy: { createdAt: "desc" } },
            student: {
              select: { id: true, fullName: true, email: true, gradeLevel: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (
      authorization.authUser.role === "TEACHER"
      && assignment.createdById !== authorization.authUser.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment detail:", error);
    return NextResponse.json({ error: "Failed to fetch assignment detail" }, { status: 500 });
  }
}
