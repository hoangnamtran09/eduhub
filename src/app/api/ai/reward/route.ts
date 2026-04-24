import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_REWARD_AMOUNTS = new Set([1, 2, 5, 10]);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = checkRateLimit(`ai-reward:${authUser.userId}:${getClientIp(request)}`, 60, 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const amount = Number(body.amount);

    if (!ALLOWED_REWARD_AMOUNTS.has(amount)) {
      return NextResponse.json({ error: "Invalid reward amount" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        diamonds: {
          increment: amount,
        },
      },
    }) as any;

    return NextResponse.json({
      success: true,
      diamonds: updatedUser.diamonds,
    });
  } catch (error) {
    console.error("Reward diamonds error:", error);
    return NextResponse.json({ error: "Failed to reward diamonds" }, { status: 500 });
  }
}
