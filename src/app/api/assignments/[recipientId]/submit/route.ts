import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { chatWithAI } from "@/lib/beeknoee/client";
import { getAssignmentPregradePrompt } from "@/lib/ai/prompts";

interface RouteParams {
  params: { recipientId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const submissionText = body?.submissionText?.trim();
    const submissionFiles = Array.isArray(body?.submissionFiles)
      ? body.submissionFiles.filter((file: any) => typeof file?.url === "string" && typeof file?.name === "string").slice(0, 5)
      : [];

    if (!submissionText && submissionFiles.length === 0) {
      return NextResponse.json({ error: "Missing submission text or file" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const updateResult = await prismaAny.assignmentRecipient.updateMany({
      where: {
        id: params.recipientId,
        studentId: authUser.userId,
      },
      data: {
        submissionText,
        submissionFiles,
        score: null,
        aiScore: null,
        feedback: null,
        rubricScores: undefined,
        status: "submitted",
        submittedAt: new Date(),
        reviewedAt: null,
        returnedAt: null,
        attemptCount: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prismaAny.assignmentRecipient.findUnique({
      where: {
        id: params.recipientId,
      },
      include: {
        assignment: true,
      },
    });

    // Fire-and-forget AI pre-grade
    if (updated?.assignment) {
      const assignment = updated.assignment;
      const rubric = Array.isArray(assignment.rubric) ? assignment.rubric : null;
      const files = Array.isArray(updated.submissionFiles) ? updated.submissionFiles : [];

      const systemPrompt = getAssignmentPregradePrompt({
        title: assignment.title,
        description: assignment.description,
        maxScore: assignment.maxScore,
        rubric,
        submissionText: submissionText || null,
        submissionFileNames: files.map((f: any) => f.name || "file"),
      });

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Hãy chấm sơ bộ bài nộp này." },
      ];

      chatWithAI(messages).then(async (aiResponse) => {
        try {
          let gradeData: { aiScore: number; rubricScores: any[]; feedback: string };
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            gradeData = JSON.parse(jsonMatch[0]);
          } else {
            gradeData = { aiScore: 0, rubricScores: [], feedback: aiResponse };
          }

          const clamp = (v: unknown, min: number, max: number, fb: number) => {
            const n = Number(v);
            return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
          };

          await prismaAny.assignmentRecipient.update({
            where: { id: params.recipientId },
            data: {
              aiScore: Math.round(clamp(gradeData.aiScore, 0, assignment.maxScore, 0)),
              feedback: typeof gradeData.feedback === "string" ? gradeData.feedback : "",
              rubricScores: Array.isArray(gradeData.rubricScores) ? gradeData.rubricScores : [],
            },
          });
        } catch (e) {
          console.error("AI pre-grade background error:", e);
        }
      }).catch((e) => console.error("AI pre-grade request error:", e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Failed to submit assignment" }, { status: 500 });
  }
}
