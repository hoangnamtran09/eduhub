import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getLearningState, updateLessonProgressPage } from "@/lib/learning-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const pageUpdateSchema = z.object({
  lessonId: z.string().min(1),
  page: z.coerce.number().int().min(1),
  totalPages: z.coerce.number().int().min(1).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = request.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  }

  const state = await getLearningState(authUser.userId, lessonId);

  return NextResponse.json({
    progress: state.progress,
    conversation: state.conversation,
  });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = pageUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid learning state payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const progress = await updateLessonProgressPage(
    authUser.userId,
    parsed.data.lessonId,
    parsed.data.page,
    parsed.data.totalPages,
  );

  return NextResponse.json(progress);
}
