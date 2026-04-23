import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(10_000),
});

const chatHistoryPayloadSchema = z.object({
  lessonId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
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

  const prismaAny = prisma as any;
  const conversations = await prismaAny.aICo.findMany({
    where: {
      lessonId,
      userId: authUser.userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const history = conversations.map((conversation: any) => ({
    id: conversation.id,
    lessonId: conversation.lessonId,
    userId: conversation.userId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: (conversation.messages || []).map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: message.metadata || null,
      timestamp: message.createdAt,
    })),
  }));

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

  const { lessonId, conversationId, messages } = parsed.data;
  const prismaAny = prisma as any;

  if (messages.length === 0) {
    const conversation = await prismaAny.aICo.create({
      data: {
        lessonId,
        userId: authUser.userId,
        title: "Đoạn chat mới",
      },
    });

    return NextResponse.json({
      id: conversation.id,
      lessonId,
      userId: authUser.userId,
      messages: [],
    });
  }

  const existingConversation = conversationId
    ? await prismaAny.aICo.findFirst({
        where: {
          id: conversationId,
          lessonId,
          userId: authUser.userId,
        },
      })
    : null;

  const conversation = existingConversation
    ? await prismaAny.$transaction(async (tx: any) => {
        await tx.aIMessage.deleteMany({
          where: { conversationId: existingConversation.id },
        });

        await tx.aICo.update({
          where: { id: existingConversation.id },
          data: {
            title:
              messages.find((message) => message.role === "user")?.content.slice(0, 80) ||
              existingConversation.title ||
              "Đoạn chat mới",
            messages: {
              create: messages.map((message) => ({
                role: message.role,
                content: message.content,
                metadata: null,
              })),
            },
          },
        });

        return tx.aICo.findUnique({
          where: { id: existingConversation.id },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        });
      })
    : await prismaAny.aICo.create({
        data: {
          lessonId,
          userId: authUser.userId,
          title: messages.find((message) => message.role === "user")?.content.slice(0, 80) || "Đoạn chat mới",
          messages: {
            create: messages.map((message) => ({
              role: message.role,
              content: message.content,
              metadata: null,
            })),
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

  return NextResponse.json({
    id: conversation.id,
    lessonId: conversation.lessonId,
    userId: conversation.userId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: message.metadata || null,
      timestamp: message.createdAt,
    })),
  });
}
