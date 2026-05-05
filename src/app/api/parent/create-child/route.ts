import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const normalizedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const gradeLevel = Number(body.gradeLevel);

    if (!normalizedEmail || !password || !fullName) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin" }, { status: 400 });
    }

    if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
      return NextResponse.json({ error: "Vui lòng chọn lớp cho con" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    const existingUser = await prismaAny.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const child = await prismaAny.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        role: "STUDENT",
        gradeLevel,
        parentId: authUser.userId,
        passwordHash,
        profile: {
          create: {
            goals: [],
            strengths: [],
            weaknesses: [],
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        gradeLevel: true,
      },
    });

    return NextResponse.json(
      { child, message: "Đã tạo tài khoản cho con thành công" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create child error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Không thể tạo tài khoản cho con", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
