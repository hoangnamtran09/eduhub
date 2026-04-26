import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

interface RouteParams {
  params: { recipientId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateResult = await prisma.assignmentRecipient.updateMany({
      where: {
        id: params.recipientId,
        studentId: authUser.userId,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.assignmentRecipient.findUnique({
      where: {
        id: params.recipientId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error accepting assignment:", error);
    return NextResponse.json(
      { error: "Failed to accept assignment" },
      { status: 500 }
    );
  }
}
