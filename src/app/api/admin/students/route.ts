import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const prismaAny = prisma as any;
    const students = await prismaAny.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        studySessions: {
          select: {
            durationSec: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, email, fullName, gradeLevel, diamonds, goals, strengths, weaknesses } = body;

    if (!id || !email?.trim()) {
      return NextResponse.json({ error: "Missing student id or email" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    const updatedStudent = await prismaAny.user.update({
      where: { id },
      data: {
        email: email.trim(),
        fullName: fullName?.trim() || null,
        gradeLevel: gradeLevel ? Number(gradeLevel) : null,
        diamonds: Number.isFinite(Number(diamonds)) ? Number(diamonds) : 0,
        profile: {
          upsert: {
            create: {
              goals: Array.isArray(goals) ? goals : [],
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
            },
            update: {
              goals: Array.isArray(goals) ? goals : [],
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
            },
          },
        },
      },
      include: {
        profile: true,
        studySessions: {
          select: {
            durationSec: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error("Error updating student:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing student id" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    await prismaAny.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
