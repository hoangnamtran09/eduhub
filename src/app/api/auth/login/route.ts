import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";
import { hashPassword, needsPasswordRehash, verifyPassword } from "@/lib/auth/password";
import { isJwtSecretConfigurationError } from "@/lib/auth/jwt-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;
    const user = await prismaAny.user.findUnique({
      where: { email },
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
        await prismaAny.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(password) },
        });
      }
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
