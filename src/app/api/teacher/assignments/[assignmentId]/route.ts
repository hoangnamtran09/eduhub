import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireTeacher } from "@/lib/auth/require-role";

interface RouteParams {
  params: { assignmentId: string };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const authorization = await requireTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const assignment = await prismaAny.assignment.findFirst({
      where: {
        id: params.assignmentId,
        createdById: authorization.authUser.userId,
      },
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
          where: { student: { teacherId: authorization.authUser.userId } },
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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching teacher assignment detail:", error);
    return NextResponse.json({ error: "Failed to fetch assignment detail" }, { status: 500 });
  }
}
