import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { normalizeAssignmentStatus } from "@/types/assignment";

interface RouteParams {
  params: { assignmentId: string };
}

function csvEscape(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
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
        lesson: { select: { title: true, subject: { select: { name: true } } } },
        recipients: {
          include: {
            student: { select: { fullName: true, email: true, gradeLevel: true } },
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

    const rubric = Array.isArray(assignment.rubric) ? assignment.rubric : [];
    const rubricColumns = rubric.flatMap((criterion: any) => [
      `rubric_${criterion.id}_score`,
      `rubric_${criterion.id}_comment`,
    ]);

    const headers = [
      "assignment_title",
      "subject",
      "lesson",
      "student_name",
      "student_email",
      "grade_level",
      "status",
      "attempt_count",
      "ai_score",
      "score",
      "feedback",
      "submitted_at",
      "reviewed_at",
      "returned_at",
      ...rubricColumns,
    ];

    const rows = assignment.recipients.map((recipient: any) => {
      const rubricScores = Array.isArray(recipient.rubricScores) ? recipient.rubricScores : [];
      const rubricValues = rubric.flatMap((criterion: any) => {
        const score = rubricScores.find((item: any) => item.criterionId === criterion.id);
        return [score?.score ?? "", score?.comment ?? ""];
      });

      return [
        assignment.title,
        assignment.lesson?.subject?.name || "",
        assignment.lesson?.title || "",
        recipient.student.fullName || "",
        recipient.student.email,
        recipient.student.gradeLevel ?? "",
        normalizeAssignmentStatus(recipient.status),
        recipient.attemptCount ?? 0,
        recipient.aiScore ?? "",
        recipient.score ?? "",
        recipient.feedback ?? "",
        recipient.submittedAt ? new Date(recipient.submittedAt).toISOString() : "",
        recipient.reviewedAt ? new Date(recipient.reviewedAt).toISOString() : "",
        recipient.returnedAt ? new Date(recipient.returnedAt).toISOString() : "",
        ...rubricValues,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="assignment-${assignment.id}-review-report.csv"`,
      },
    });
  } catch (error) {
    console.error("Export assignment review report error:", error);
    return NextResponse.json({ error: "Failed to export assignment report" }, { status: 500 });
  }
}
