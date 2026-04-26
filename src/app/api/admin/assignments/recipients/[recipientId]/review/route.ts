import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { parseAssignmentRubric, type AssignmentRubricScoreJson } from "@/lib/assignments/json";

interface RubricScoreInput {
  criterionId?: string;
  title?: string;
  score?: number;
  maxScore?: number;
  comment?: string;
}

interface ReviewRequestBody {
  action?: "review" | "return";
  score?: number;
  feedback?: string;
  rubricScores?: RubricScoreInput[];
}

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
    const body = await request.json() as ReviewRequestBody;
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

    const recipient = await prisma.assignmentRecipient.findUnique({
      where: { id: params.recipientId },
      include: { assignment: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (
      authorization.authUser.role === "TEACHER"
      && recipient.assignment?.createdById !== authorization.authUser.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rubric = parseAssignmentRubric(recipient.assignment?.rubric);
    const normalizedRubricScores = rubricScores.map((item) => {
      const criterion = rubric.find((rubricItem) => rubricItem.id === item?.criterionId);
      const maxScore = Number(criterion?.maxScore || item?.maxScore || 0);
      const rawScore = Number(item?.score || 0);
      return {
        criterionId: String(item?.criterionId || criterion?.id || ""),
        title: String(item?.title || criterion?.title || "Tiêu chí"),
        score: Math.max(0, Math.min(maxScore, rawScore)),
        maxScore,
        comment: typeof item?.comment === "string" ? item.comment.trim() : "",
      };
    }).filter((item) => item.criterionId) as AssignmentRubricScoreJson[];

    if (rubric.length > 0 && normalizedRubricScores.length !== rubric.length) {
      return NextResponse.json({ error: "Rubric scores are incomplete" }, { status: 400 });
    }

    const computedScore = normalizedRubricScores.length > 0
      ? normalizedRubricScores.reduce<number>((sum, item: AssignmentRubricScoreJson) => sum + item.score, 0)
      : score;

    if (computedScore !== null && !Number.isFinite(computedScore)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    if (computedScore !== null && computedScore > Number(recipient.assignment?.maxScore || 0)) {
      return NextResponse.json({ error: "Score exceeds assignment max score" }, { status: 400 });
    }

    if (action === "review" && (computedScore === null || !Number.isFinite(computedScore))) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }

    const updated = await prisma.assignmentRecipient.update({
      where: { id: params.recipientId },
      data: {
        status: action === "return" ? "RETURNED" : "REVIEWED",
        score: action === "return" ? null : computedScore,
        feedback,
        rubricScores: normalizedRubricScores as unknown as Prisma.InputJsonValue,
        reviewedById: authorization.authUser.userId,
        reviewedAt: action === "review" ? new Date() : null,
        returnedAt: action === "return" ? new Date() : null,
        feedbackEvents: {
          create: {
            status: action === "return" ? "RETURNED" : "REVIEWED",
            score: action === "return" ? null : computedScore,
            feedback,
            rubricScores: normalizedRubricScores as unknown as Prisma.InputJsonValue,
            reviewerId: authorization.authUser.userId,
            attemptCount: recipient.attemptCount || 0,
          },
        },
      },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, gradeLevel: true },
        },
        feedbackEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Review assignment submission error:", error);
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
