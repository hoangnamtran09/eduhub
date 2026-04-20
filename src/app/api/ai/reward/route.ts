import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
