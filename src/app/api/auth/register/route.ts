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
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;
    
    // Check if user exists
    const existingUser = await prismaAny.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    // Create user
    const user = await prismaAny.user.create({
      data: {
        email,
        fullName,
        role: "STUDENT",
        passwordHash: await hashPassword(password),
      },
    });

    // Create student profile if role is student
    if (user.role === "STUDENT") {
      await prismaAny.studentProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Create JWT
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
