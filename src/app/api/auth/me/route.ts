import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret, isJwtSecretConfigurationError } from "@/lib/auth/jwt-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
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
    if (isJwtSecretConfigurationError(error)) {
      return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
    }

    return NextResponse.json({ user: null }, { status: 401 });
  }
}
