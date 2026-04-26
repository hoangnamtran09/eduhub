import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { chatWithAI } from "@/lib/beeknoee/client";
import { getAssignmentPregradePrompt } from "@/lib/ai/prompts";
import { parseAssignmentRubric, parseSubmissionFiles } from "@/lib/assignments/json";

interface RouteParams {
  params: { recipientId: string };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipient = await prisma.assignmentRecipient.findUnique({
      where: { id: params.recipientId },
      include: {
        assignment: true,
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (recipient.studentId !== authUser.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["SUBMITTED", "RETURNED"].includes(recipient.status)) {
      return NextResponse.json({ error: "Assignment is not ready for AI grading" }, { status: 400 });
    }

    const assignment = recipient.assignment;
    const rubric = parseAssignmentRubric(assignment.rubric);
    const submissionFiles = parseSubmissionFiles(recipient.submissionFiles);

    const systemPrompt = getAssignmentPregradePrompt({
      title: assignment.title,
      description: assignment.description,
      maxScore: assignment.maxScore,
      rubric: rubric.length ? rubric : null,
      submissionText: recipient.submissionText,
      submissionFileNames: submissionFiles.map((file) => file.name || "file"),
    });

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hãy chấm sơ bộ bài nộp này." },
    ];

    const aiResponse = await chatWithAI(messages);

    let gradeData: { aiScore: number; rubricScores: any[]; feedback: string };
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      gradeData = {
        aiScore: 0,
        rubricScores: [],
        feedback: aiResponse,
      };
    }

    gradeData.aiScore = clampNumber(gradeData.aiScore, 0, assignment.maxScore, 0);
    gradeData.rubricScores = Array.isArray(gradeData.rubricScores) ? gradeData.rubricScores : [];
    gradeData.feedback = typeof gradeData.feedback === "string" ? gradeData.feedback : "";

    await prisma.assignmentRecipient.update({
      where: { id: params.recipientId },
      data: {
        aiScore: Math.round(gradeData.aiScore),
        feedback: gradeData.feedback,
        rubricScores: gradeData.rubricScores,
      },
    });

    return NextResponse.json({
      aiScore: Math.round(gradeData.aiScore),
      rubricScores: gradeData.rubricScores,
      feedback: gradeData.feedback,
    });
  } catch (error) {
    console.error("AI pre-grade error:", error);
    return NextResponse.json({ error: "Failed to AI pre-grade" }, { status: 500 });
  }
}
