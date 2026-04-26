import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Họ và tên là bắt buộc").max(120),
  gradeLevel: z.coerce.number().int().min(1).max(12).nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu hồ sơ không hợp lệ" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        fullName: parsed.data.fullName,
        gradeLevel: parsed.data.gradeLevel,
      },
      include: { profile: true },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Update settings profile error:", error);
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ" }, { status: 500 });
  }
}
