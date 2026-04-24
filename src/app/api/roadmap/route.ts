import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getLearningInsights } from "@/lib/learning-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insights = await getLearningInsights(authUser.userId);

    return NextResponse.json({
      generatedAt: insights.generatedAt,
      summary: insights.summary,
      roadmap: insights.roadmap,
      focusAreas: insights.weaknesses.map((item) => ({
        id: item.id,
        topic: item.topic,
        severity: item.severity,
        score: item.score,
        lessonId: item.lessonId ?? null,
        subjectName: item.subjectName ?? item.topic,
        reason: item.reason,
        recommendedAction: item.recommendedAction,
      })),
    });
  } catch (error) {
    console.error("Roadmap error:", error);
    return NextResponse.json({ error: "Failed to load roadmap" }, { status: 500 });
  }
}
