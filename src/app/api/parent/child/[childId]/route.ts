import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getLearningInsights } from "@/lib/learning-insights";

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
    case "streak_days": return metrics.streakDays >= ruleValue;
    case "avg_quiz_score": return metrics.averageScore >= ruleValue;
    case "completed_exercises": return metrics.completedExercises >= ruleValue;
    case "total_study_hours": return metrics.totalStudySeconds >= ruleValue * 3600;
    case "weekly_study_hours": return metrics.weeklyStudySeconds >= ruleValue * 3600;
    case "diamonds": return metrics.diamonds >= ruleValue;
    default: return false;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { childId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { childId } = params;
    const prismaAny = prisma as any;

    const child = await prismaAny.user.findFirst({
      where: { id: childId, parentId: authUser.userId, role: "STUDENT" },
      select: {
        id: true,
        email: true,
        fullName: true,
        gradeLevel: true,
        diamonds: true,
        profile: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weeklyStart = new Date(startOfToday);
    weeklyStart.setDate(startOfToday.getDate() - 6);

    const [
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
      prismaAny.studySession.findMany({
        where: { userId: childId, startedAt: { gte: weeklyStart } },
        select: { startedAt: true, durationSec: true },
        orderBy: { startedAt: "desc" },
      }),
      prismaAny.studySession.aggregate({
        where: { userId: childId },
        _sum: { durationSec: true },
      }),
      prismaAny.studySession.aggregate({
        where: { userId: childId, startedAt: { gte: weeklyStart } },
        _sum: { durationSec: true },
      }),
      prismaAny.quizAttempt.aggregate({
        where: { userId: childId },
        _avg: { score: true },
      }),
      prismaAny.exerciseAttempt.count({
        where: { userId: childId, score: { gte: 80 } },
      }),
      prismaAny.exerciseAttempt.findMany({
        where: { userId: childId },
        select: { score: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prismaAny.quizAttempt.findMany({
        where: { userId: childId },
        select: { score: true, totalQuestions: true, startedAt: true },
        orderBy: { startedAt: "desc" },
        take: 3,
      }),
      prismaAny.studySession.findMany({
        where: { userId: childId },
        select: { startedAt: true, lesson: { select: { title: true } } },
        orderBy: { startedAt: "desc" },
        take: 3,
      }),
      prismaAny.assignmentRecipient.findMany({
        where: {
          studentId: childId,
          status: { notIn: ["SUBMITTED", "REVIEWED"] },
        },
        include: { assignment: { select: { title: true, dueDate: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

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

    const assignments = assignmentRecipients.map((recipient: any) => ({
      id: recipient.id,
      title: recipient.assignment?.title || "Bài tập",
      dueDate: recipient.assignment?.dueDate || null,
      status: recipient.status,
      isOverdue: recipient.assignment?.dueDate
        ? new Date(recipient.assignment.dueDate).getTime() < now.getTime()
        : false,
    }));

    const metrics = {
      streakDays: Number(child.profile?.streakDays || 0),
      averageScore: avgQuizScore,
      completedExercises,
      totalStudySeconds,
      weeklyStudySeconds,
      diamonds: child.diamonds || 0,
    };

    let achievements: any[] = [];
    try {
      if (prismaAny.achievement) {
        const dbAchievements = await prismaAny.achievement.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });
        if (Array.isArray(dbAchievements) && dbAchievements.length > 0) {
          achievements = dbAchievements.map((achievement: any) => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            unlocked: isAchievementUnlocked(achievement.ruleType, achievement.ruleValue, metrics),
          }));
        }
      }
    } catch (achievementError) {
      console.warn("Achievement query failed:", achievementError);
    }

    const recentActivity = [
      ...(recentExerciseAttempts || []).map((attempt: any) => ({
        type: "exercise" as const,
        title: `Bài tập AI: ${attempt.score ?? 0}/100 điểm`,
        timestamp: new Date(attempt.createdAt).toISOString(),
        icon: "📝",
      })),
      ...(recentQuizAttempts || []).map((attempt: any) => ({
        type: "quiz" as const,
        title: `Quiz: ${attempt.score}/${attempt.totalQuestions}`,
        timestamp: new Date(attempt.startedAt).toISOString(),
        icon: "🎯",
      })),
      ...(recentStudySessions || []).map((session: any) => ({
        type: "study" as const,
        title: `Học bài: ${session.lesson?.title || "Bài học"}`,
        timestamp: new Date(session.startedAt).toISOString(),
        icon: "⏱️",
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((item) => ({
        ...item,
        time: new Date(item.timestamp).toLocaleString("vi-VN"),
      }))
      .slice(0, 6);

    let insights = null;
    try {
      insights = await getLearningInsights(childId);
    } catch (insightsError) {
      console.warn("Learning insights failed for child:", childId, insightsError);
    }

    return NextResponse.json({
      child: {
        id: child.id,
        email: child.email,
        fullName: child.fullName,
        gradeLevel: child.gradeLevel,
      },
      stats: {
        averageScore: Number(avgQuizScore.toFixed(1)),
        completedExercises,
        weeklyStudyHours: Number((weeklyStudySeconds / 3600).toFixed(1)),
        totalStudySeconds,
        achievementCount: achievements.filter((item) => item.unlocked).length,
        totalAchievements: achievements.length,
        streakDays: Number(child.profile?.streakDays || 0),
        diamonds: child.diamonds || 0,
        pendingAssignments,
        overdueAssignments,
        topWeakness: Array.isArray(child.profile?.weaknesses) && child.profile.weaknesses.length > 0
          ? String(child.profile.weaknesses[0])
          : null,
      },
      weeklyProgress,
      achievements,
      assignments,
      recentActivity,
      weaknesses: insights?.weaknesses || [],
      roadmap: insights?.roadmap || [],
    });
  } catch (error) {
    console.error("Parent child API error:", error);
    return NextResponse.json(
      { error: "Failed to load child data", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
