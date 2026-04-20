import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key_change_me"
);

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const prismaAny = prisma as any;
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
