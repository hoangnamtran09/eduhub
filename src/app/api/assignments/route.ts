import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;
    const assignments = await prismaAny.assignmentRecipient.findMany({
      where: {
        studentId: authUser.userId,
      },
      include: {
        assignment: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                subjectId: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const sortedAssignments = assignments.sort((a: any, b: any) => {
      const statusPriority: Record<string, number> = {
        assigned: 0,
        pending: 0,
        accepted: 1,
        submitted: 2,
      };
      const leftPriority = statusPriority[String(a.status || "pending").toLowerCase()] ?? 0;
      const rightPriority = statusPriority[String(b.status || "pending").toLowerCase()] ?? 0;

      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftDue = a.assignment?.dueDate ? new Date(a.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = b.assignment?.dueDate ? new Date(b.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDue - rightDue;
    });

    return NextResponse.json(sortedAssignments);
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
