import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const notificationSettingsSchema = z.object({
  dailyStudyReminder: z.boolean(),
  newAssignmentNotification: z.boolean(),
  weeklyEmailReport: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = notificationSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu thông báo không hợp lệ" },
        { status: 400 },
      );
    }

    const prismaAny = prisma as any;
    const updatedUser = await prismaAny.user.update({
      where: { id: authUser.userId },
      data: parsed.data,
      include: { profile: true },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Update notification settings error:", error);
    return NextResponse.json({ error: "Không thể cập nhật cài đặt thông báo" }, { status: 500 });
  }
}
