import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

interface RouteParams {
  params: { recipientId: string };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request, { params }: RouteParams) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const body = await request.json();
    const action = body?.action === "return" ? "return" : "review";
    const score = Number.isFinite(Number(body?.score)) ? Number(body.score) : null;
    const feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
    const rubricScores = Array.isArray(body?.rubricScores) ? body.rubricScores : [];

    if (action === "review" && score === null) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }

    if (!feedback) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const recipient = await prismaAny.assignmentRecipient.findUnique({
      where: { id: params.recipientId },
      include: { assignment: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const rubric = Array.isArray(recipient.assignment?.rubric) ? recipient.assignment.rubric : [];
    const normalizedRubricScores = rubricScores.map((item: any) => {
      const criterion = rubric.find((rubricItem: any) => rubricItem.id === item?.criterionId);
      const maxScore = Number(criterion?.maxScore || item?.maxScore || 0);
      const rawScore = Number(item?.score || 0);
      return {
        criterionId: String(item?.criterionId || criterion?.id || ""),
        title: String(item?.title || criterion?.title || "Tiêu chí"),
        score: Math.max(0, Math.min(maxScore, rawScore)),
        maxScore,
        comment: typeof item?.comment === "string" ? item.comment.trim() : "",
      };
    }).filter((item: any) => item.criterionId);

    const computedScore = normalizedRubricScores.length
      ? normalizedRubricScores.reduce((sum: number, item: any) => sum + item.score, 0)
      : score;

    if (action === "review" && (computedScore === null || !Number.isFinite(computedScore))) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }

    const history = Array.isArray(recipient.feedbackHistory) ? recipient.feedbackHistory : [];
    const historyItem = {
      status: action === "return" ? "returned" : "reviewed",
      score: action === "return" ? null : computedScore,
      feedback,
      rubricScores: normalizedRubricScores,
      reviewerId: authorization.authUser.userId,
      createdAt: new Date().toISOString(),
      attemptCount: recipient.attemptCount || 0,
    };

    const updated = await prismaAny.assignmentRecipient.update({
      where: { id: params.recipientId },
      data: {
        status: action === "return" ? "returned" : "reviewed",
        score: action === "return" ? null : computedScore,
        feedback,
        rubricScores: normalizedRubricScores,
        feedbackHistory: [...history, historyItem],
        reviewedById: authorization.authUser.userId,
        reviewedAt: action === "review" ? new Date() : null,
        returnedAt: action === "return" ? new Date() : null,
      },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, gradeLevel: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Review assignment submission error:", error);
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
