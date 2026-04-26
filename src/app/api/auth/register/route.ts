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
    const gradeLevel = Number(body.gradeLevel);

    if (!normalizedEmail || !password || !fullName || !Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin và chọn lớp" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        role: "STUDENT",
        gradeLevel,
        passwordHash: await hashPassword(password),
      },
    });

    // Create student profile if role is student
    if (user.role === "STUDENT") {
      await prisma.studentProfile.create({
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
