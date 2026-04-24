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
      mistakes: insights.mistakes,
      topWeaknessTopics: insights.weaknesses.map((item) => item.topic),
    });
  } catch (error) {
    console.error("Mistakes route error:", error);
    return NextResponse.json({ error: "Failed to load mistakes" }, { status: 500 });
  }
}
