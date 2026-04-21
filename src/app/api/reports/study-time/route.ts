import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

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
        },
        orderBy: { createdAt: "desc" },
      });

      const data = students.map((student: any) => ({
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        gradeLevel: student.gradeLevel,
        totalStudySeconds: (student.studySessions || []).reduce((sum: number, session: any) => sum + (session.durationSec || 0), 0),
        totalSessions: (student.studySessions || []).length,
        lastActive: student.profile?.lastActive || null,
      }));

      return NextResponse.json({ role: authUser.role, students: data });
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
