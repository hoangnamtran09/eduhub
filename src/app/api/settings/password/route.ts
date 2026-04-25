import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự").max(128),
});

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu mật khẩu không hợp lệ" },
        { status: 400 },
      );
    }

    const prismaAny = prisma as any;
    const user = await prismaAny.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không chính xác" }, { status: 400 });
    }

    await prismaAny.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return NextResponse.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Update settings password error:", error);
    return NextResponse.json({ error: "Không thể đổi mật khẩu" }, { status: 500 });
  }
}
