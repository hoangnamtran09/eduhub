import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { isJwtSecretConfigurationError } from "@/lib/auth/jwt-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const role = body?.role === "PARENT" ? "PARENT" : "STUDENT";
    const gradeLevel = role === "STUDENT" ? Number(body.gradeLevel) : null;

    if (!normalizedEmail || !password || !fullName) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    if (role === "STUDENT" && (!Number.isInteger(gradeLevel) || (gradeLevel as number) < 1 || (gradeLevel as number) > 12)) {
      return NextResponse.json(
        { error: "Vui lòng chọn lớp" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        role,
        gradeLevel,
        passwordHash: await hashPassword(password),
      },
    });

    if (user.role === "STUDENT") {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    const token = await createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    await setAuthCookie(token);

    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: "Đăng ký thành công"
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (isJwtSecretConfigurationError(error)) {
      return NextResponse.json(
        { error: "Authentication is not configured. Missing JWT_SECRET." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng ký" },
      { status: 500 }
    );
  }
}
