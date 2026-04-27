import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { isAssignmentOverdue, normalizeAssignmentStatus } from "@/types/assignment";

const DUE_SOON_MS = 3 * 24 * 60 * 60 * 1000;

function isIncomplete(status: string) {
  const normalizedStatus = normalizeAssignmentStatus(status);
  return normalizedStatus !== "submitted" && normalizedStatus !== "reviewed";
}

function isAssignmentDueSoon(status: string, dueDate: Date | string | null) {
  if (!dueDate || !isIncomplete(status)) return false;
  const dueTime = new Date(dueDate).getTime();
  const now = Date.now();
  return dueTime >= now && dueTime <= now + DUE_SOON_MS;
}

function getAssignmentPriority(item: { status: string; assignment: { dueDate: Date | string | null } }) {
  const normalizedStatus = normalizeAssignmentStatus(item.status);
  if (isAssignmentOverdue(item.status, item.assignment.dueDate ? new Date(item.assignment.dueDate).toISOString() : null)) return 0;
  if (isAssignmentDueSoon(item.status, item.assignment.dueDate)) return 1;
  if (normalizedStatus === "returned") return 2;
  if (normalizedStatus === "assigned") return 3;
  if (normalizedStatus === "accepted") return 4;
  if (normalizedStatus === "submitted") return 5;
  if (normalizedStatus === "reviewed") return 6;
  return 7;
}

function sortAssignments<T extends { status: string; createdAt: Date; assignment: { dueDate: Date | string | null } }>(assignments: T[]) {
  return assignments.sort((a, b) => {
    const leftPriority = getAssignmentPriority(a);
    const rightPriority = getAssignmentPriority(b);

    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    const leftDue = a.assignment?.dueDate ? new Date(a.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = b.assignment?.dueDate ? new Date(b.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (leftDue !== rightDue) return leftDue - rightDue;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function buildStats(assignments: Array<{ status: string; assignment: { dueDate: Date | string | null } }>) {
  return assignments.reduce(
    (stats, item) => {
      const normalizedStatus = normalizeAssignmentStatus(item.status);
      stats.total += 1;
      if (normalizedStatus === "assigned") stats.pending += 1;
      if (normalizedStatus === "accepted") stats.accepted += 1;
      if (normalizedStatus === "submitted") stats.submitted += 1;
      if (normalizedStatus === "reviewed") stats.reviewed += 1;
      if (normalizedStatus === "returned") stats.returned += 1;
      if (isAssignmentOverdue(item.status, item.assignment.dueDate ? new Date(item.assignment.dueDate).toISOString() : null)) stats.overdue += 1;
      if (isAssignmentDueSoon(item.status, item.assignment.dueDate)) stats.dueSoon += 1;
      return stats;
    },
    { total: 0, pending: 0, accepted: 0, submitted: 0, reviewed: 0, returned: 0, overdue: 0, dueSoon: 0 },
  );
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role === "PARENT") {
      const children = await prisma.user.findMany({
        where: {
          parentId: authUser.userId,
          role: "STUDENT",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          gradeLevel: true,
          assignedTasks: {
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
          },
        },
      });

      const shapedChildren = children.map((child) => {
        const sortedChildAssignments = sortAssignments([...child.assignedTasks]);
        const stats = buildStats(sortedChildAssignments);

        return {
          id: child.id,
          name: child.fullName || child.email,
          email: child.email,
          gradeLevel: child.gradeLevel,
          stats,
          assignments: sortedChildAssignments.map((item) => ({
            ...item,
            childId: child.id,
            childName: child.fullName || child.email,
            childEmail: child.email,
            childGradeLevel: child.gradeLevel,
          })),
        };
      }).sort((a, b) => {
        const leftUrgency = a.stats.overdue * 100 + a.stats.dueSoon * 20 + a.stats.returned * 10 + a.stats.pending + a.stats.accepted;
        const rightUrgency = b.stats.overdue * 100 + b.stats.dueSoon * 20 + b.stats.returned * 10 + b.stats.pending + b.stats.accepted;
        return rightUrgency - leftUrgency;
      });

      const allAssignments = shapedChildren.flatMap((child) => child.assignments);
      const summary = buildStats(allAssignments);

      return NextResponse.json({
        role: "PARENT",
        children: shapedChildren,
        summary: {
          totalChildren: shapedChildren.length,
          totalAssignments: summary.total,
          pending: summary.pending,
          accepted: summary.accepted,
          submitted: summary.submitted,
          reviewed: summary.reviewed,
          returned: summary.returned,
          overdue: summary.overdue,
          dueSoon: summary.dueSoon,
        },
      });
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json(sortAssignments(assignments));
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
