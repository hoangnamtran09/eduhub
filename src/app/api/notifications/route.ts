import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  level: "critical" | "warning" | "info" | "success";
  kind: "profile" | "assignment_due" | "assignment_feedback" | "study_reminder" | "parent_alert" | "admin_alert";
  createdAt: string;
};

function dueLevel(dueDate: Date | null) {
  if (!dueDate) return null;
  const hoursLeft = (dueDate.getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursLeft < 0) return "critical" as const;
  if (hoursLeft <= 48) return "warning" as const;
  return null;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;
    const now = new Date().toISOString();
    const notifications: NotificationItem[] = [];

    const user = await prismaAny.user.findUnique({
      where: { id: authUser.userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (authUser.role === "STUDENT") {
      if (!user.gradeLevel || !user.fullName) {
        notifications.push({
          id: "profile-incomplete",
          title: "Hoàn thiện hồ sơ học tập",
          description: "Cập nhật họ tên và lớp để hệ thống cá nhân hóa lộ trình tốt hơn.",
          href: "/settings",
          level: "warning",
          kind: "profile",
          createdAt: now,
        });
      }

      const allowStudyReminder = user.dailyStudyReminder ?? true;
      const allowAssignmentNotifications = user.newAssignmentNotification ?? true;

      const assignments = await prismaAny.assignmentRecipient.findMany({
        where: {
          studentId: authUser.userId,
          status: { in: ["ASSIGNED", "ACCEPTED", "RETURNED", "REVIEWED"] },
        },
        include: { assignment: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      assignments.forEach((recipient: any) => {
        if (!allowAssignmentNotifications && ["REVIEWED", "RETURNED"].includes(recipient.status)) {
          return;
        }

        if (recipient.status === "REVIEWED") {
          notifications.push({
            id: `reviewed-${recipient.id}`,
            title: "Bài tập đã được chấm",
            description: recipient.assignment?.title || "Bạn đã nhận được phản hồi mới từ giáo viên.",
            href: "/assignments",
            level: "success",
            kind: "assignment_feedback",
            createdAt: recipient.reviewedAt || now,
          });
          return;
        }

        if (recipient.status === "RETURNED") {
          notifications.push({
            id: `returned-${recipient.id}`,
            title: "Bài tập cần chỉnh sửa",
            description: recipient.feedback || recipient.assignment?.title || "Giáo viên đã trả bài để bạn sửa lại.",
            href: "/assignments",
            level: "warning",
            kind: "assignment_feedback",
            createdAt: recipient.returnedAt || now,
          });
          return;
        }

        const dueDate = recipient.assignment?.dueDate ? new Date(recipient.assignment.dueDate) : null;
        const level = dueLevel(dueDate);
        if (!level || !allowAssignmentNotifications) return;

        notifications.push({
          id: `assignment-${recipient.id}`,
          title: level === "critical" ? "Bài tập đã quá hạn" : "Bài tập sắp đến hạn",
          description: recipient.assignment?.title || "Bạn có một bài tập cần xử lý.",
          href: "/assignments",
          level,
          kind: "assignment_due",
          createdAt: recipient.assignment?.dueDate || now,
        });
      });

      if (allowStudyReminder && (user.profile?.streakDays || 0) === 0) {
        notifications.push({
          id: "start-streak",
          title: "Bắt đầu chuỗi học hôm nay",
          description: "Học một bài ngắn để kích hoạt chuỗi và mở khóa gợi ý tiến độ.",
          href: "/courses",
          level: "info",
          kind: "study_reminder",
          createdAt: now,
        });
      }
    }

    if (authUser.role === "PARENT") {
      const children = await prismaAny.user.findMany({
        where: { parentId: authUser.userId, role: "STUDENT" },
        include: {
          profile: true,
          assignedTasks: { include: { assignment: true } },
        },
      });

      children.forEach((child: any) => {
        const inactiveDays = child.profile?.lastActive
          ? Math.floor((Date.now() - new Date(child.profile.lastActive).getTime()) / (24 * 60 * 60 * 1000))
          : null;

        if (inactiveDays === null || inactiveDays > 7) {
          notifications.push({
            id: `inactive-${child.id}`,
            title: "Con cần được nhắc học",
            description: `${child.fullName || child.email} ${inactiveDays === null ? "chưa có hoạt động học" : `không học ${inactiveDays} ngày`}.`,
            href: "/",
            level: inactiveDays === null || inactiveDays > 14 ? "critical" : "warning",
            kind: "parent_alert",
            createdAt: now,
          });
        }

        child.assignedTasks?.forEach((recipient: any) => {
          const level = dueLevel(recipient.assignment?.dueDate ? new Date(recipient.assignment.dueDate) : null);
          if (!level || ["SUBMITTED", "REVIEWED"].includes(String(recipient.status))) return;
          notifications.push({
            id: `parent-assignment-${recipient.id}`,
            title: level === "critical" ? "Bài tập của con đã quá hạn" : "Bài tập của con sắp đến hạn",
            description: `${child.fullName || child.email}: ${recipient.assignment?.title || "Bài tập"}`,
            href: "/assignments",
            level,
            kind: "parent_alert",
            createdAt: recipient.assignment?.dueDate || now,
          });
        });
      });
    }

    if (authUser.role === "ADMIN") {
      const [ungradedStudents, inactiveStudents] = await Promise.all([
        prismaAny.user.count({ where: { role: "STUDENT", gradeLevel: null } }),
        prismaAny.studentProfile.count({
          where: {
            OR: [
              { lastActive: null },
              { lastActive: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            ],
          },
        }),
      ]);

      if (ungradedStudents > 0) {
        notifications.push({
          id: "admin-ungraded-students",
          title: "Có học sinh chưa phân lớp",
          description: `${ungradedStudents} hồ sơ cần bổ sung lớp để cá nhân hóa nội dung học.`,
          href: "/admin/students",
          level: "warning",
          kind: "admin_alert",
          createdAt: now,
        });
      }

      if (inactiveStudents > 0) {
        notifications.push({
          id: "admin-inactive-students",
          title: "Nhóm học sinh cần theo dõi",
          description: `${inactiveStudents} học sinh chưa hoạt động trong 7 ngày hoặc chưa có phiên học.`,
          href: "/",
          level: "info",
          kind: "admin_alert",
          createdAt: now,
        });
      }
    }

    const sortedNotifications = notifications
      .sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2, success: 3 };
        return priority[a.level] - priority[b.level] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 12);

    return NextResponse.json({
      unreadCount: sortedNotifications.filter((item) => item.level === "critical" || item.level === "warning").length,
      notifications: sortedNotifications,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
