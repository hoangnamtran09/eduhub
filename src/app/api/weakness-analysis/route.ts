import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getLearningInsights } from "@/lib/learning-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let effectiveUserId = authUser.userId;

    if (authUser.role === "PARENT") {
      const { searchParams } = new URL(request.url);
      const childId = searchParams.get("childId");
      if (!childId) {
        return NextResponse.json({ error: "childId is required for parent access" }, { status: 400 });
      }
      const prismaAny = prisma as any;
      const child = await prismaAny.user.findFirst({
        where: { id: childId, parentId: authUser.userId, role: "STUDENT" },
        select: { id: true },
      });
      if (!child) {
        return NextResponse.json({ error: "Child not found or not yours" }, { status: 403 });
      }
      effectiveUserId = childId;
    } else if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insights = await getLearningInsights(effectiveUserId);

    return NextResponse.json({
      generatedAt: insights.generatedAt,
      summary: insights.summary,
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      mistakes: insights.mistakes,
    });
  } catch (error) {
    console.error("Weakness analysis error:", error);
    return NextResponse.json({ error: "Failed to load weakness analysis" }, { status: 500 });
  }
}
