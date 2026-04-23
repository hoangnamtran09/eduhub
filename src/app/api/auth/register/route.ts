import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import * as crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key_change_me"
);

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

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
        role: role || "STUDENT",
        passwordHash: hashPassword(password),
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
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Set cookie
    cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: "Đăng ký thành công"
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng ký" },
      { status: 500 }
    );
  }
}
