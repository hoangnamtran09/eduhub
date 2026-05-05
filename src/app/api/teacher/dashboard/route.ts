import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireTeacher } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function daysBetween(from: Date, to: Date) {
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000));
}

export async function GET() {
  const authorization = await requireTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const teacherId = authorization.authUser.userId;
    const prismaAny = prisma as any;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weeklyStart = new Date(startOfToday);
    weeklyStart.setDate(startOfToday.getDate() - 6);
    const nextWeek = new Date(startOfToday);
    nextWeek.setDate(startOfToday.getDate() + 7);

    const teacher = await prismaAny.user.findUnique({
      where: { id: teacherId },
      select: { fullName: true, email: true },
    });

    const students = await prismaAny.user.findMany({
      where: { role: "STUDENT", teacherId },
      select: {
        id: true,
        fullName: true,
        email: true,
        gradeLevel: true,
        profile: true,
      },
    });

    const studentIds = students.map((s: any) => s.id);

    const [
      pendingReviewsCount,
      overdueCount,
      recentSubmissions,
      weeklySessions,
      studyTimeRows,
      upcomingAssignments,
    ] = await Promise.all([
      prismaAny.assignmentRecipient.count({
        where: {
          status: "SUBMITTED",
          studentId: { in: studentIds },
          assignment: { createdById: teacherId },
        },
      }),
      prismaAny.assignmentRecipient.count({
        where: {
          status: { notIn: ["SUBMITTED", "REVIEWED"] },
          studentId: { in: studentIds },
          assignment: { createdById: teacherId, dueDate: { lt: now } },
        },
      }),
      studentIds.length
        ? prismaAny.assignmentRecipient.findMany({
            where: {
              status: "SUBMITTED",
              studentId: { in: studentIds },
              assignment: { createdById: teacherId },
            },
            include: {
              student: { select: { id: true, fullName: true, email: true } },
              assignment: { select: { id: true, title: true } },
            },
            orderBy: { submittedAt: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
      studentIds.length
        ? prismaAny.studySession.findMany({
            where: { userId: { in: studentIds }, startedAt: { gte: weeklyStart } },
            select: { startedAt: true, durationSec: true },
          })
        : Promise.resolve([]),
      studentIds.length
        ? prismaAny.studySession.groupBy({
            by: ["userId"],
            where: { userId: { in: studentIds } },
            _sum: { durationSec: true },
          })
        : Promise.resolve([]),
      prismaAny.assignment.findMany({
        where: {
          createdById: teacherId,
          dueDate: { gte: now, lte: nextWeek },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          recipients: { select: { id: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
    ]);

    const activeThisWeek = students.filter((s: any) => {
      if (!s.profile?.lastActive) return false;
      return new Date(s.profile.lastActive) >= weeklyStart;
    }).length;

    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (6 - index));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const totalSeconds = (weeklySessions || [])
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

    const studyTimeMap = new Map<string, number>();
    studyTimeRows.forEach((row: any) => {
      studyTimeMap.set(row.userId, row._sum.durationSec || 0);
    });

    const topStudents = students
      .map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        gradeLevel: s.gradeLevel,
        totalStudySeconds: studyTimeMap.get(s.id) || 0,
        lastActive: s.profile?.lastActive || null,
      }))
      .sort((a: any, b: any) => b.totalStudySeconds - a.totalStudySeconds)
      .filter((s: any) => s.totalStudySeconds > 0)
      .slice(0, 5);

    const attentionStudents = students
      .filter((s: any) => {
        const total = studyTimeMap.get(s.id) || 0;
        if (total === 0) return true;
        if (!s.profile?.lastActive) return true;
        return daysBetween(new Date(s.profile.lastActive), now) > 7;
      })
      .map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        gradeLevel: s.gradeLevel,
        totalStudySeconds: studyTimeMap.get(s.id) || 0,
        inactiveDays: s.profile?.lastActive ? daysBetween(new Date(s.profile.lastActive), now) : null,
      }))
      .sort((a: any, b: any) => {
        const scoreA = (a.totalStudySeconds === 0 ? 3 : 0) + (a.inactiveDays === null ? 2 : 0);
        const scoreB = (b.totalStudySeconds === 0 ? 3 : 0) + (b.inactiveDays === null ? 2 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 8);

    return NextResponse.json({
      teacher: { fullName: teacher?.fullName, email: teacher?.email },
      stats: {
        totalStudents: students.length,
        activeThisWeek,
        pendingReviews: pendingReviewsCount,
        overdueAssignments: overdueCount,
      },
      recentSubmissions: recentSubmissions.map((r: any) => ({
        id: r.id,
        assignmentTitle: r.assignment?.title || "Bài tập",
        assignmentId: r.assignment?.id,
        studentName: r.student?.fullName || r.student?.email || "Học sinh",
        studentId: r.student?.id,
        status: r.status,
        submittedAt: r.submittedAt,
      })),
      weeklyActivity,
      upcomingDeadlines: upcomingAssignments.map((a: any) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        studentCount: a.recipients?.length || 0,
      })),
      topStudents,
      attentionStudents,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
