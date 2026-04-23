import { prisma } from "@/lib/prisma/client";

const prismaAny = prisma as any;

export async function ensureLessonProgress(userId: string, lessonId: string) {
  const now = new Date();

  return prismaAny.lessonProgress.upsert({
    where: {
      lessonId_userId: {
        lessonId,
        userId,
      },
    },
    create: {
      lessonId,
      userId,
      startedAt: now,
      lastStudiedAt: now,
      status: "IN_PROGRESS",
    },
    update: {
      lastStudiedAt: now,
      status: "IN_PROGRESS",
    },
  });
}

export async function ensureLessonProgressWithClient(client: any, userId: string, lessonId: string) {
  const now = new Date();

  return client.lessonProgress.upsert({
    where: {
      lessonId_userId: {
        lessonId,
        userId,
      },
    },
    create: {
      lessonId,
      userId,
      startedAt: now,
      lastStudiedAt: now,
      status: "IN_PROGRESS",
    },
    update: {
      lastStudiedAt: now,
      status: "IN_PROGRESS",
    },
  });
}

export async function updateLessonProgressStudyTime(userId: string, lessonId: string, seconds: number) {
  const extraSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const now = new Date();

  return prismaAny.lessonProgress.upsert({
    where: {
      lessonId_userId: {
        lessonId,
        userId,
      },
    },
    create: {
      lessonId,
      userId,
      startedAt: now,
      lastStudiedAt: now,
      totalStudySec: extraSeconds,
      status: "IN_PROGRESS",
    },
    update: {
      lastStudiedAt: now,
      totalStudySec: {
        increment: extraSeconds,
      },
      status: "IN_PROGRESS",
    },
  });
}

export async function updateLessonProgressPage(
  userId: string,
  lessonId: string,
  page: number,
  totalPages?: number | null,
) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeTotalPages = totalPages ? Math.max(1, Math.floor(Number(totalPages))) : null;
  const now = new Date();
  const isCompleted = !!safeTotalPages && safePage >= safeTotalPages;

  return prismaAny.lessonProgress.upsert({
    where: {
      lessonId_userId: {
        lessonId,
        userId,
      },
    },
    create: {
      lessonId,
      userId,
      startedAt: now,
      lastStudiedAt: now,
      lastPage: safePage,
      completed: isCompleted,
      completedAt: isCompleted ? now : null,
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
    },
    update: {
      lastStudiedAt: now,
      lastPage: safePage,
      completed: isCompleted,
      completedAt: isCompleted ? now : null,
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
    },
  });
}

export async function getLearningState(userId: string, lessonId: string) {
  const [progress, latestConversation] = await Promise.all([
    prismaAny.lessonProgress.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
    }),
    prismaAny.aICo.findFirst({
      where: { userId, lessonId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  return {
    progress,
    conversation: latestConversation,
  };
}
