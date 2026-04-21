import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;

    const [user, studySessions, quizAttempts, exerciseAttempts] = await Promise.all([
      prismaAny.user.findUnique({
        where: { id: authUser.userId },
        include: { profile: true },
      }),
      prismaAny.studySession.findMany({
        where: { userId: authUser.userId },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
      prismaAny.quizAttempt.findMany({
        where: { userId: authUser.userId },
        orderBy: { startedAt: "desc" },
      }),
      prismaAny.exerciseAttempt.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (6 - index));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const totalSeconds = (studySessions || [])
        .filter((session: any) => {
          const startedAt = new Date(session.startedAt);
          return startedAt >= dayStart && startedAt < dayEnd;
        })
        .reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);

      return {
        day: dayLabels[date.getDay()],
        hours: Number((totalSeconds / 3600).toFixed(1)),
        completed: totalSeconds > 0,
      };
    });

    const totalStudySeconds = (studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);
    const weeklyStudySeconds = (studySessions || [])
      .filter((session: any) => new Date(session.startedAt) >= new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000))
      .reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);

    const avgQuizScore = quizAttempts?.length
      ? quizAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / quizAttempts.length
      : 0;

    const completedExercises = (exerciseAttempts || []).filter(
      (attempt: any) => typeof attempt.score === "number" && attempt.score >= 80,
    ).length;

    const achievements = [
      {
        id: "streak",
        title: "Chăm chỉ",
        description: "Học 7 ngày liên tiếp",
        icon: "🔥",
        unlocked: (user.profile?.streakDays || 0) >= 7,
      },
      {
        id: "quiz",
        title: "Điểm cao",
        description: "Đạt từ 8 điểm quiz trở lên",
        icon: "🎯",
        unlocked: avgQuizScore >= 8,
      },
      {
        id: "exercise",
        title: "Bền bỉ",
        description: "Hoàn thành 5 bài tập AI đạt yêu cầu",
        icon: "📚",
        unlocked: completedExercises >= 5,
      },
      {
        id: "time",
        title: "Tập trung",
        description: "Tích lũy ít nhất 5 giờ học",
        icon: "⭐",
        unlocked: totalStudySeconds >= 5 * 3600,
      },
    ];

    const recentActivity = [
      ...(exerciseAttempts || []).slice(0, 3).map((attempt: any) => ({
        type: "exercise",
        title: `Bài tập AI: ${attempt.score ?? 0}/100 điểm`,
        timestamp: new Date(attempt.createdAt).toISOString(),
        icon: "📝",
        color: "text-brand-600",
        bgColor: "bg-brand-50",
      })),
      ...(quizAttempts || []).slice(0, 3).map((attempt: any) => ({
        type: "quiz",
        title: `Quiz: ${attempt.score}/${attempt.totalQuestions}`,
        timestamp: new Date(attempt.startedAt).toISOString(),
        icon: "🎯",
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
      })),
      ...(studySessions || []).slice(0, 3).map((session: any) => ({
        type: "study",
        title: `Học bài: ${session.lesson?.title || "Bài học"}`,
        timestamp: new Date(session.startedAt).toISOString(),
        icon: "⏱️",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((item) => ({
        ...item,
        time: new Date(item.timestamp).toLocaleString("vi-VN"),
      }))
      .slice(0, 6);

    return NextResponse.json({
      stats: {
        averageScore: Number(avgQuizScore.toFixed(1)),
        completedExercises,
        weeklyStudyHours: Number((weeklyStudySeconds / 3600).toFixed(1)),
        achievementCount: achievements.filter((item) => item.unlocked).length,
        totalAchievements: achievements.length,
        streakDays: user.profile?.streakDays || 0,
        diamonds: user.diamonds || 0,
      },
      weeklyProgress,
      achievements,
      recentActivity,
    });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      {
        error: "Failed to load progress data",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
