import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// GET: /api/chat-history?lessonId=...
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lessonId');
  if (!lessonId) {
    return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
  }
  const history = await prisma.chatHistory.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(history);
}

// POST: /api/chat-history { lessonId, messages }
export async function POST(req: NextRequest) {
  const { lessonId, messages } = await req.json();
  if (!lessonId || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing lessonId or messages' }, { status: 400 });
  }
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
