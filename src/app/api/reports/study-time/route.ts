import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(from: Date, to: Date) {
  const fromDay = startOfDay(from).getTime();
  const toDay = startOfDay(to).getTime();
  return Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000));
}

function getAssignmentUrgency(dueDate: Date | null, now: Date) {
  if (!dueDate) return "normal" as const;
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (60 * 60 * 1000);

  if (diffHours < 0) return "overdue" as const;
  if (diffHours <= 48) return "due_soon" as const;
  return "normal" as const;
}

function summarizeAlertLevel(counts: { critical: number; warning: number }) {
  if (counts.critical > 0) return "critical" as const;
  if (counts.warning > 0) return "warning" as const;
  return "good" as const;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;

    if (authUser.role === "ADMIN") {
      const students = await prismaAny.user.findMany({
        where: { role: "STUDENT" },
        include: {
          studySessions: true,
          profile: true,
          enrollments: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();

      const data = students.map((student: any) => {
        const totalStudySeconds = (student.studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);
        const lastActive = student.profile?.lastActive || null;
        const inactiveDays = lastActive ? diffInDays(new Date(lastActive), now) : null;

        return {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          gradeLevel: student.gradeLevel,
          totalStudySeconds,
          totalSessions: (student.studySessions || []).length,
          lastActive,
          streakDays: student.profile?.streakDays || 0,
          enrollmentCount: (student.enrollments || []).length,
          isActive7d: inactiveDays !== null && inactiveDays <= 7,
          inactiveDays,
        };
      });

      const totalStudySeconds = data.reduce((sum: number, student: any) => sum + student.totalStudySeconds, 0);
      const totalSessions = data.reduce((sum: number, student: any) => sum + student.totalSessions, 0);
      const activeStudents7d = data.filter((student: any) => student.isActive7d).length;
      const inactiveStudents7d = data.length - activeStudents7d;
      const unassignedGradeCount = data.filter((student: any) => !student.gradeLevel).length;

      const gradeDistribution = Object.values(
        data.reduce((acc: Record<string, { gradeLevel: number | null; count: number }>, student: any) => {
          const key = student.gradeLevel ? String(student.gradeLevel) : "none";
          if (!acc[key]) {
            acc[key] = {
              gradeLevel: student.gradeLevel || null,
              count: 0,
            };
          }
          acc[key].count += 1;
          return acc;
        }, {}),
      ) as Array<{ gradeLevel: number | null; count: number }>;

      gradeDistribution.sort((a, b) => {
        if (a.gradeLevel === null) return 1;
        if (b.gradeLevel === null) return -1;
        return a.gradeLevel - b.gradeLevel;
      });

      const topStudents = [...data]
        .sort((a, b) => b.totalStudySeconds - a.totalStudySeconds)
        .slice(0, 6);

      const attentionStudents = data
        .filter((student: any) => student.totalSessions === 0 || student.inactiveDays === null || student.inactiveDays > 7 || !student.gradeLevel)
        .sort((a: any, b: any) => {
          const scoreA = (a.totalSessions === 0 ? 3 : 0) + (!a.gradeLevel ? 2 : 0) + (a.inactiveDays !== null && a.inactiveDays > 7 ? 1 : 0);
          const scoreB = (b.totalSessions === 0 ? 3 : 0) + (!b.gradeLevel ? 2 : 0) + (b.inactiveDays !== null && b.inactiveDays > 7 ? 1 : 0);
          return scoreB - scoreA;
        })
        .slice(0, 8);

      return NextResponse.json({
        role: authUser.role,
        summary: {
          totalStudents: data.length,
          totalStudySeconds,
          totalSessions,
          activeStudents7d,
          inactiveStudents7d,
          unassignedGradeCount,
        },
        students: data,
        topStudents,
        attentionStudents,
        gradeDistribution,
      });
    }

    if (authUser.role === "PARENT") {
      const parent = await prismaAny.user.findUnique({
        where: { id: authUser.userId },
        include: {
          children: {
            include: {
              studySessions: {
                include: {
                  lesson: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
                orderBy: { startedAt: "desc" },
              },
              profile: true,
              assignedTasks: {
                include: {
                  assignment: {
                    include: {
                      lesson: {
                        select: {
                          id: true,
                          title: true,
                        },
                      },
                    },
                  },
                },
                orderBy: [
                  { submittedAt: "desc" },
                  { createdAt: "desc" },
                ],
              },
            },
          },
        },
      });

      const now = new Date();
      const children = (parent?.children || []).map((child: any) => {
        const totalStudySeconds = (child.studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);
        const totalSessions = (child.studySessions || []).length;
        const lastActive = child.profile?.lastActive || null;
        const inactiveDays = lastActive ? diffInDays(new Date(lastActive), now) : null;
        const isActive7d = inactiveDays !== null && inactiveDays <= 7;
        const weaknesses = Array.isArray(child.profile?.weaknesses) ? child.profile.weaknesses.filter(Boolean) : [];
        const assignedTasks = child.assignedTasks || [];

        const assignmentSummary = assignedTasks.reduce(
          (acc: {
            total: number;
            pending: number;
            submitted: number;
            overdue: number;
            dueSoon: number;
          }, recipient: any) => {
            const status = String(recipient.status || "assigned").toLowerCase();
            const isSubmitted = status === "submitted";
            const dueDate = recipient.assignment?.dueDate ? new Date(recipient.assignment.dueDate) : null;
            const urgency = getAssignmentUrgency(dueDate, now);

            acc.total += 1;
            if (isSubmitted) {
              acc.submitted += 1;
            } else {
              acc.pending += 1;
              if (urgency === "overdue") acc.overdue += 1;
              if (urgency === "due_soon") acc.dueSoon += 1;
            }

            return acc;
          },
          { total: 0, pending: 0, submitted: 0, overdue: 0, dueSoon: 0 },
        );

        const recentAssignments = assignedTasks
          .slice()
          .sort((a: any, b: any) => {
            const left = a.assignment?.dueDate ? new Date(a.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            const right = b.assignment?.dueDate ? new Date(b.assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            return left - right;
          })
          .slice(0, 3)
          .map((recipient: any) => ({
            id: recipient.id,
            title: recipient.assignment?.title || "Bài tập",
            dueDate: recipient.assignment?.dueDate || null,
            status: recipient.status,
            lessonTitle: recipient.assignment?.lesson?.title || null,
          }));

        const recentActivity = (child.studySessions || []).slice(0, 3).map((session: any) => ({
          id: session.id,
          startedAt: session.startedAt,
          durationSec: session.durationSec || 0,
          lessonTitle: session.lesson?.title || null,
        }));

        const alertItems: Array<{ type: string; level: "critical" | "warning"; label: string }> = [];

        if (assignmentSummary.overdue > 0) {
          alertItems.push({
            type: "assignment_overdue",
            level: "critical",
            label: `${assignmentSummary.overdue} bài tập quá hạn`,
          });
        }

        if (!isActive7d) {
          alertItems.push({
            type: "inactive",
            level: inactiveDays === null || inactiveDays > 14 ? "critical" : "warning",
            label: inactiveDays === null ? "Chưa có hoạt động học" : `Không học ${inactiveDays} ngày`,
          });
        }

        if (assignmentSummary.dueSoon > 0) {
          alertItems.push({
            type: "assignment_due_soon",
            level: "warning",
            label: `${assignmentSummary.dueSoon} bài tập sắp đến hạn`,
          });
        }

        if (weaknesses.length > 0) {
          alertItems.push({
            type: "weakness_signal",
            level: "warning",
            label: `${weaknesses.length} chủ đề cần củng cố`,
          });
        }

        const criticalCount = alertItems.filter((item) => item.level === "critical").length;
        const warningCount = alertItems.filter((item) => item.level === "warning").length;

        return {
          id: child.id,
          fullName: child.fullName,
          email: child.email,
          gradeLevel: child.gradeLevel,
          totalStudySeconds,
          totalSessions,
          lastActive,
          inactiveDays,
          isActive7d,
          assignmentSummary,
          weaknessSummary: {
            count: weaknesses.length,
            topics: weaknesses.slice(0, 3),
          },
          recentAssignments,
          recentActivity,
          alertSummary: {
            level: summarizeAlertLevel({ critical: criticalCount, warning: warningCount }),
            criticalCount,
            warningCount,
            items: alertItems,
          },
        };
      });

      const summary = children.reduce(
        (acc: {
          totalChildren: number;
          activeChildren7d: number;
          childrenNeedingAttention: number;
          totalPendingAssignments: number;
          totalOverdueAssignments: number;
          totalDueSoonAssignments: number;
        }, child: any) => {
          acc.totalChildren += 1;
          if (child.isActive7d) acc.activeChildren7d += 1;
          if (child.alertSummary.level !== "good") acc.childrenNeedingAttention += 1;
          acc.totalPendingAssignments += child.assignmentSummary.pending;
          acc.totalOverdueAssignments += child.assignmentSummary.overdue;
          acc.totalDueSoonAssignments += child.assignmentSummary.dueSoon;
          return acc;
        },
        {
          totalChildren: 0,
          activeChildren7d: 0,
          childrenNeedingAttention: 0,
          totalPendingAssignments: 0,
          totalOverdueAssignments: 0,
          totalDueSoonAssignments: 0,
        },
      );

      const spotlightAlerts = children
        .flatMap((child: any) =>
          child.alertSummary.items.map((item: any) => ({
            childId: child.id,
            childName: child.fullName || child.email,
            childEmail: child.email,
            childGradeLevel: child.gradeLevel,
            ...item,
          })),
        )
        .sort((a: any, b: any) => {
          const priority: Record<string, number> = { critical: 0, warning: 1 };
          return (priority[a.level] ?? 2) - (priority[b.level] ?? 2);
        })
        .slice(0, 6);

      const assignmentWatchlist = children
        .flatMap((child: any) =>
          child.recentAssignments.map((assignment: any) => ({
            childId: child.id,
            childName: child.fullName || child.email,
            childGradeLevel: child.gradeLevel,
            ...assignment,
          })),
        )
        .sort((a: any, b: any) => {
          const left = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const right = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          return left - right;
        })
        .slice(0, 8);

      return NextResponse.json({
        role: authUser.role,
        summary,
        children,
        spotlightAlerts,
        assignmentWatchlist,
      });
    }

    const sessions = await prismaAny.studySession.findMany({
      where: { userId: authUser.userId },
      include: {
          lesson: {
          select: { id: true, title: true, subjectId: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const totalStudySeconds = sessions.reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);

    if (authUser.role === "STUDENT") {
      const currentStudent = await prismaAny.user.findUnique({
        where: { id: authUser.userId },
        select: {
          id: true,
          gradeLevel: true,
          fullName: true,
        },
      });

      const peerCandidates = await prismaAny.user.findMany({
        where: {
          role: "STUDENT",
          ...(currentStudent?.gradeLevel ? { gradeLevel: currentStudent.gradeLevel } : {}),
        },
        include: {
          studySessions: true,
          profile: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const normalizedPeers = peerCandidates.map((student: any) => {
        const peerStudySeconds = (student.studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);
        return {
          id: student.id,
          fullName: student.fullName,
          gradeLevel: student.gradeLevel,
          totalStudySeconds: peerStudySeconds,
          totalSessions: (student.studySessions || []).length,
          lastActive: student.profile?.lastActive || null,
        };
      });

      type PeerRecord = (typeof normalizedPeers)[number];

      const leaderboard = [...normalizedPeers]
        .sort((a: PeerRecord, b: PeerRecord) => {
          if (b.totalStudySeconds !== a.totalStudySeconds) {
            return b.totalStudySeconds - a.totalStudySeconds;
          }
          return b.totalSessions - a.totalSessions;
        })
        .map((student: PeerRecord, index: number) => ({
          ...student,
          rank: index + 1,
          isCurrentUser: student.id === authUser.userId,
        }));

      const currentStudentRank = leaderboard.find((student: PeerRecord & { rank: number; isCurrentUser: boolean }) => student.id === authUser.userId)?.rank || null;
      const peers = normalizedPeers
        .filter((student: PeerRecord) => student.id !== authUser.userId)
        .sort((a: PeerRecord, b: PeerRecord) => {
          const aActive = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          const bActive = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          return bActive - aActive;
        })
        .slice(0, 10);

      const activePeers7d = peers.filter((student: PeerRecord) => {
        if (!student.lastActive) return false;
        return diffInDays(new Date(student.lastActive), new Date()) <= 7;
      }).length;

      return NextResponse.json({
        role: authUser.role,
        totalStudySeconds,
        totalSessions: sessions.length,
        sessions,
        continueLesson: sessions[0]?.lesson
          ? {
              id: sessions[0].lesson.id,
              title: sessions[0].lesson.title,
              subjectId: sessions[0].lesson.subjectId,
            }
          : null,
        leaderboard: leaderboard.slice(0, 10),
        currentStudentRank,
        peers,
        communitySummary: {
          totalVisiblePeers: peers.length,
          activePeers7d,
        },
      });
    }

    return NextResponse.json({
      role: authUser.role,
      totalStudySeconds,
      totalSessions: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Study report error:", error);
    return NextResponse.json({ error: "Failed to load study report" }, { status: 500 });
  }
}
