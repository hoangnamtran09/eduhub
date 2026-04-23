import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(from: Date, to: Date) {
  const fromDay = startOfDay(from).getTime();
  const toDay = startOfDay(to).getTime();
  return Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000));
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
              studySessions: true,
              profile: true,
            },
          },
        },
      });

      const children = (parent?.children || []).map((child: any) => ({
        id: child.id,
        fullName: child.fullName,
        email: child.email,
        gradeLevel: child.gradeLevel,
        totalStudySeconds: (child.studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0),
        totalSessions: (child.studySessions || []).length,
        lastActive: child.profile?.lastActive || null,
      }));

      return NextResponse.json({ role: authUser.role, children });
    }

    const sessions = await prismaAny.studySession.findMany({
      where: { userId: authUser.userId },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const totalStudySeconds = sessions.reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0);

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
