import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;
    const assignments = await prismaAny.assignmentRecipient.findMany({
      where: {
        studentId: authUser.userId,
      },
      include: {
        assignment: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                subjectId: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          submittedAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
