import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(10_000),
});

const chatHistoryPayloadSchema = z.object({
  lessonId: z.string().min(1),
  messages: z.array(messageSchema).max(200),
});

// GET: /api/chat-history?lessonId=...
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  }

  const history = await prisma.chatHistory.findMany({
    where: { lessonId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(history);
}

// POST: /api/chat-history { lessonId, messages }
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = chatHistoryPayloadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid chat history payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { lessonId, messages } = parsed.data;

  // Xoá lịch sử cũ và lưu mới (1 lịch sử cho mỗi lesson)
  await prisma.chatHistory.deleteMany({ where: { lessonId } });

  if (messages.length === 0) {
    return NextResponse.json({ lessonId, messages: [] });
  }

  const created = await prisma.chatHistory.create({
    data: {
      lessonId,
      messages,
    },
  });
  return NextResponse.json(created);
}
