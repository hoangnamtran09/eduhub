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

    const body = await request.json();
    const submissionText = body?.submissionText?.trim();

    if (!submissionText) {
      return NextResponse.json({ error: "Missing submission text" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const updateResult = await prismaAny.assignmentRecipient.updateMany({
      where: {
        id: params.recipientId,
        studentId: authUser.userId,
      },
      data: {
        submissionText,
        status: "submitted",
        submittedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prismaAny.assignmentRecipient.findUnique({
      where: {
        id: params.recipientId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Failed to submit assignment" }, { status: 500 });
  }
}
