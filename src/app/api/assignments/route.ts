import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await prisma.assignmentRecipient.findMany({
      where: {
        studentId: authUser.userId,
      },
      include: {
        feedbackEvents: {
          orderBy: { createdAt: "desc" },
        },
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
        RETURNED: 0,
        ASSIGNED: 1,
        ACCEPTED: 2,
        SUBMITTED: 3,
        REVIEWED: 4,
      };
      const leftPriority = statusPriority[String(a.status || "ASSIGNED")] ?? 0;
      const rightPriority = statusPriority[String(b.status || "ASSIGNED")] ?? 0;

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
