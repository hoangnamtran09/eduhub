import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";
import { hashPassword, needsPasswordRehash, verifyPassword } from "@/lib/auth/password";
import { isJwtSecretConfigurationError } from "@/lib/auth/jwt-secret";
import type { UserRole } from "@/types";

const USER_ROLES: UserRole[] = ["STUDENT", "PARENT", "ADMIN", "TEACHER"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    const expectedRole = body?.expectedRole;

    if (expectedRole && !USER_ROLES.includes(expectedRole)) {
      return NextResponse.json(
        { error: "Vai trò không hợp lệ" },
        { status: 400 }
      );
    }

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        gradeLevel: true,
        diamonds: true,
        dailyStudyReminder: true,
        newAssignmentNotification: true,
        weeklyEmailReport: true,
        emailVerified: true,
        createdAt: true,
        parentId: true,
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Verify password if hash exists
    if (user.passwordHash) {
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Email hoặc mật khẩu không chính xác" },
          { status: 401 }
        );
      }

      if (needsPasswordRehash(user.passwordHash)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(password) },
        });
      }
    }

    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        { error: "Tài khoản không thuộc vai trò đã chọn" },
        { status: 403 }
      );
    }

    // Create JWT
    const token = await createAuthToken({
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    await setAuthCookie(token);

    // Return user info (excluding password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: "Đăng nhập thành công"
    });
  } catch (error) {
    console.error("Login error:", error);
    if (isJwtSecretConfigurationError(error)) {
      return NextResponse.json(
        { error: "Authentication is not configured. Missing JWT_SECRET." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng nhập" },
      { status: 500 }
    );
  }
}
