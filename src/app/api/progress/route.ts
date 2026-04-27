import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function isAchievementUnlocked(ruleType: string, ruleValue: number, metrics: {
  streakDays: number;
  averageScore: number;
  completedExercises: number;
  totalStudySeconds: number;
  weeklyStudySeconds: number;
  diamonds: number;
}) {
  switch (ruleType) {
    case "streak_days":
      return metrics.streakDays >= ruleValue;
    case "avg_quiz_score":
      return metrics.averageScore >= ruleValue;
    case "completed_exercises":
      return metrics.completedExercises >= ruleValue;
    case "total_study_hours":
      return metrics.totalStudySeconds >= ruleValue * 3600;
    case "weekly_study_hours":
      return metrics.weeklyStudySeconds >= ruleValue * 3600;
    case "diamonds":
      return metrics.diamonds >= ruleValue;
    default:
      return false;
  }
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weeklyStart = new Date(startOfToday);
    weeklyStart.setDate(startOfToday.getDate() - 6);

    const [
      user,
      weeklyStudySessions,
      totalStudyAggregate,
      weeklyStudyAggregate,
      quizScoreAggregate,
      completedExercises,
      recentExerciseAttempts,
      recentQuizAttempts,
      recentStudySessions,
      assignmentRecipients,
    ] = await Promise.all([
      prismaAny.user.findUnique({
        where: { id: authUser.userId },
        include: { profile: true },
      }),
      prismaAny.studySession.findMany({
        where: {
          userId: authUser.userId,
          startedAt: { gte: weeklyStart },
        },
        select: {
          startedAt: true,
          durationSec: true,
        },
        orderBy: { startedAt: "desc" },
      }),
      prismaAny.studySession.aggregate({
        where: { userId: authUser.userId },
        _sum: { durationSec: true },
      }),
      prismaAny.studySession.aggregate({
        where: {
          userId: authUser.userId,
          startedAt: { gte: weeklyStart },
        },
        _sum: { durationSec: true },
      }),
      prismaAny.quizAttempt.aggregate({
        where: { userId: authUser.userId },
        _avg: { score: true },
      }),
      prismaAny.exerciseAttempt.count({
        where: {
          userId: authUser.userId,
          score: { gte: 80 },
        },
      }),
      prismaAny.exerciseAttempt.findMany({
        where: { userId: authUser.userId },
        select: {
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prismaAny.quizAttempt.findMany({
        where: { userId: authUser.userId },
        select: {
          score: true,
          totalQuestions: true,
          startedAt: true,
        },
        orderBy: { startedAt: "desc" },
        take: 3,
      }),
      prismaAny.studySession.findMany({
        where: { userId: authUser.userId },
        select: {
          startedAt: true,
          lesson: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 3,
      }),
      prismaAny.assignmentRecipient.findMany({
        where: {
          studentId: authUser.userId,
          status: { notIn: ["SUBMITTED", "REVIEWED"] },
        },
        include: {
          assignment: {
            select: {
              title: true,
              dueDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (6 - index));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const totalSeconds = (weeklyStudySessions || [])
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

    const totalStudySeconds = totalStudyAggregate._sum.durationSec || 0;
    const weeklyStudySeconds = weeklyStudyAggregate._sum.durationSec || 0;
    const avgQuizScore = quizScoreAggregate._avg.score || 0;
    const pendingAssignments = assignmentRecipients.length;
    const overdueAssignments = assignmentRecipients.filter((recipient: any) => {
      if (!recipient.assignment?.dueDate) return false;
      return new Date(recipient.assignment.dueDate).getTime() < now.getTime();
    }).length;
    const dueSoonAssignment = assignmentRecipients
      .filter((recipient: any) => recipient.assignment?.dueDate)
      .sort((a: any, b: any) => new Date(a.assignment.dueDate).getTime() - new Date(b.assignment.dueDate).getTime())[0] || null;
    const topWeakness = Array.isArray(user.profile?.weaknesses) && user.profile.weaknesses.length > 0
      ? String(user.profile.weaknesses[0])
      : null;

    const metrics = {
      streakDays: user.profile?.streakDays || 0,
      averageScore: avgQuizScore,
      completedExercises,
      totalStudySeconds,
      weeklyStudySeconds,
      diamonds: user.diamonds || 0,
    };

    let achievementConfigs: any[] = [];

    try {
      if (prismaAny.achievement) {
        const dbAchievements = await prismaAny.achievement.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });

        if (Array.isArray(dbAchievements) && dbAchievements.length > 0) {
          achievementConfigs = dbAchievements;
        }
      }
    } catch (achievementError) {
      console.warn("Achievement query failed:", achievementError);
    }

    const achievements = achievementConfigs.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: isAchievementUnlocked(achievement.ruleType, achievement.ruleValue, metrics),
    }));

    const recentActivity = [
      ...(recentExerciseAttempts || []).map((attempt: any) => ({
        type: "exercise",
        title: `Bài tập AI: ${attempt.score ?? 0}/100 điểm`,
        timestamp: new Date(attempt.createdAt).toISOString(),
        icon: "📝",
        color: "text-brand-600",
        bgColor: "bg-brand-50",
      })),
      ...(recentQuizAttempts || []).map((attempt: any) => ({
        type: "quiz",
        title: `Quiz: ${attempt.score}/${attempt.totalQuestions}`,
        timestamp: new Date(attempt.startedAt).toISOString(),
        icon: "🎯",
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
      })),
      ...(recentStudySessions || []).map((session: any) => ({
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
        achievementCount: achievements.filter((item: { unlocked: boolean }) => item.unlocked).length,
        totalAchievements: achievements.length,
        streakDays: user.profile?.streakDays || 0,
        diamonds: user.diamonds || 0,
        pendingAssignments,
        overdueAssignments,
        dueSoonAssignment: dueSoonAssignment
          ? {
              title: dueSoonAssignment.assignment?.title || "Bài tập",
              dueDate: dueSoonAssignment.assignment?.dueDate || null,
            }
          : null,
        topWeakness,
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
