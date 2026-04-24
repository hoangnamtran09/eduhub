import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/prisma/client";
import { getLearningInsights, inferTopicFromText, normalizeTopic } from "@/lib/learning-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prismaAny = prisma as any;

type WeaknessSignalBody = {
  topic?: string | null;
  question?: string | null;
  reason?: string | null;
  source?: "QUIZ" | "EXERCISE" | "PROFILE" | null;
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as WeaknessSignalBody;
    const topic = normalizeTopic(body.topic) || inferTopicFromText(body.question);

    if (!topic || topic === "Tổng quan") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const profile = await prismaAny.studentProfile.upsert({
      where: { userId: authUser.userId },
      update: {},
      create: {
        userId: authUser.userId,
        goals: [],
        strengths: [],
        weaknesses: [],
      },
    });

    const normalizedExisting = Array.isArray(profile.weaknesses)
      ? profile.weaknesses.map((item: string) => normalizeTopic(item)).filter(Boolean)
      : [];

    const dedupedWeaknesses = [
      topic,
      ...normalizedExisting.filter((item: string) => item !== topic),
    ].slice(0, 12);

    await prismaAny.studentProfile.update({
      where: { userId: authUser.userId },
      data: {
        weaknesses: dedupedWeaknesses,
        lastActive: new Date(),
      },
    });

    const insights = await getLearningInsights(authUser.userId);

    return NextResponse.json({
      success: true,
      topic,
      source: body.source ?? "QUIZ",
      reason: body.reason ?? "Câu trả lời gần đây cho thấy chủ đề này cần ôn thêm",
      generatedAt: insights.generatedAt,
      weaknesses: insights.weaknesses,
      roadmap: insights.roadmap,
      mistakes: insights.mistakes,
    });
  } catch (error) {
    console.error("Weakness signal error:", error);
    return NextResponse.json({ error: "Failed to record weakness signal" }, { status: 500 });
  }
}
