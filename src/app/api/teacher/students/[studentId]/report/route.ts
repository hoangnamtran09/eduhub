import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireTeacher } from "@/lib/auth/require-role";
import { getLearningInsights } from "@/lib/learning-insights";
import { isAssignmentOverdue, normalizeAssignmentStatus } from "@/types/assignment";

interface RouteParams {
  params: { studentId: string };
}

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isIncompleteAssignment(status: string) {
  const normalizedStatus = normalizeAssignmentStatus(status);
  return normalizedStatus !== "submitted" && normalizedStatus !== "reviewed";
}

function isAssignmentDueSoon(status: string, dueDate: Date | string | null) {
  if (!dueDate || !isIncompleteAssignment(status)) return false;
  const dueTime = new Date(dueDate).getTime();
  const now = Date.now();
  return dueTime >= now && dueTime <= now + 3 * 24 * 60 * 60 * 1000;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const authorization = await requireTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const teacherId = authorization.authUser.userId;
    const studentId = params.studentId;
    const prismaAny = prisma as any;
    const student = await prismaAny.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
        teacherId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        gradeLevel: true,
        diamonds: true,
        profile: true,
        parent: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const now = new Date();
    const startToday = startOfDay(now);
    const weeklyStart = new Date(startToday);
    weeklyStart.setDate(startToday.getDate() - 6);

    const [
      totalStudyAggregate,
      weeklyStudyAggregate,
      weeklyStudySessions,
      recentStudySessions,
      lessonProgress,
      quizScoreAggregate,
      recentQuizAttempts,
      recentExerciseAttempts,
      completedExercises,
      assignmentRecipients,
      insights,
    ] = await Promise.all([
      prismaAny.studySession.aggregate({
        where: { userId: studentId },
        _sum: { durationSec: true },
        _count: { id: true },
      }),
      prismaAny.studySession.aggregate({
        where: { userId: studentId, startedAt: { gte: weeklyStart } },
        _sum: { durationSec: true },
      }),
      prismaAny.studySession.findMany({
        where: { userId: studentId, startedAt: { gte: weeklyStart } },
        select: { startedAt: true, durationSec: true },
        orderBy: { startedAt: "desc" },
      }),
      prismaAny.studySession.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          startedAt: true,
          durationSec: true,
          lesson: {
            select: {
              id: true,
              title: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      prismaAny.lessonProgress.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          status: true,
          progressPct: true,
          lastStudiedAt: true,
          lesson: {
            select: {
              id: true,
              title: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ lastStudiedAt: "desc" }, { startedAt: "desc" }],
        take: 12,
      }),
      prismaAny.quizAttempt.aggregate({
        where: { userId: studentId },
        _avg: { score: true },
      }),
      prismaAny.quizAttempt.findMany({
        where: { userId: studentId },
        select: {
          id: true,
          score: true,
          totalQuestions: true,
          startedAt: true,
          quiz: {
            select: {
              title: true,
              lesson: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      prismaAny.exerciseAttempt.findMany({
        where: { userId: studentId },
        select: { id: true, score: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prismaAny.exerciseAttempt.count({ where: { userId: studentId, score: { gte: 80 } } }),
      prismaAny.assignmentRecipient.findMany({
        where: { studentId, assignment: { createdById: teacherId } },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              maxScore: true,
              lesson: {
                select: {
                  id: true,
                  title: true,
                  subject: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      }),
      getLearningInsights(studentId),
    ]);

    const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startToday);
      date.setDate(startToday.getDate() - (6 - index));
      const dayStart = startOfDay(date);
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

    const assignmentSummary = assignmentRecipients.reduce(
      (stats: any, recipient: any) => {
        const status = normalizeAssignmentStatus(String(recipient.status || "ASSIGNED"));
        stats.total += 1;
        if (status === "assigned") stats.pending += 1;
        if (status === "accepted") stats.accepted += 1;
        if (status === "submitted") stats.submitted += 1;
        if (status === "reviewed") stats.reviewed += 1;
        if (status === "returned") stats.returned += 1;
        if (isAssignmentOverdue(recipient.status, recipient.assignment?.dueDate ? new Date(recipient.assignment.dueDate).toISOString() : null)) stats.overdue += 1;
        if (isAssignmentDueSoon(recipient.status, recipient.assignment?.dueDate || null)) stats.dueSoon += 1;
        return stats;
      },
      { total: 0, pending: 0, accepted: 0, submitted: 0, reviewed: 0, returned: 0, overdue: 0, dueSoon: 0 },
    );

    const progressSummary = lessonProgress.reduce(
      (stats: any, progress: any) => {
        stats.total += 1;
        if (progress.status === "COMPLETED") stats.completed += 1;
        if (progress.status === "IN_PROGRESS") stats.inProgress += 1;
        if (progress.status === "NOT_STARTED") stats.notStarted += 1;
        return stats;
      },
      { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    );

    return NextResponse.json({
      student,
      summary: {
        totalStudySeconds: totalStudyAggregate._sum.durationSec || 0,
        totalSessions: totalStudyAggregate._count.id || 0,
        weeklyStudySeconds: weeklyStudyAggregate._sum.durationSec || 0,
        averageQuizScore: Number((quizScoreAggregate._avg.score || 0).toFixed(1)),
        completedExercises,
        streakDays: student.profile?.streakDays || 0,
        lastActive: student.profile?.lastActive || null,
        diamonds: student.diamonds || 0,
        assignments: assignmentSummary,
        progress: progressSummary,
      },
      weeklyProgress,
      recentActivity: recentStudySessions.map((session: any) => ({
        id: session.id,
        startedAt: session.startedAt,
        durationSec: session.durationSec || 0,
        lesson: session.lesson,
      })),
      lessonProgress,
      quizAttempts: recentQuizAttempts,
      exerciseAttempts: recentExerciseAttempts,
      assignments: assignmentRecipients,
      insights,
    });
  } catch (error) {
    console.error("Teacher student report error:", error);
    return NextResponse.json({ error: "Failed to load student report" }, { status: 500 });
  }
}
