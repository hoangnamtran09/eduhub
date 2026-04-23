import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import * as crypto from "crypto";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
      const hashedPassword = hashPassword(password);
      if (user.passwordHash !== hashedPassword) {
        return NextResponse.json(
          { error: "Email hoặc mật khẩu không chính xác" },
          { status: 401 }
        );
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
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng nhập" },
      { status: 500 }
    );
  }
}
