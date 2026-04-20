import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const prismaAny = prisma as any;
    const subjects = await prismaAny.subject.findMany({
      include: {
        lessons: true,
        courses: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform to include statistics
    const subjectsWithStats = subjects.map((subject: any) => {
      const totalLessons = subject.lessons?.length || 0;

      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        gradient: getGradientFromColor(subject.color || "blue"),
        description: subject.description,
        totalLessons,
        coursesCount: subject.courses?.length || 0,
      };
    });

    return NextResponse.json(subjectsWithStats);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

function getGradientFromColor(color: string): string {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-cyan-400",
    amber: "from-amber-500 to-orange-400",
    emerald: "from-emerald-500 to-teal-400",
    violet: "from-violet-500 to-purple-400",
    red: "from-red-500 to-pink-400",
    pink: "from-pink-500 to-rose-400",
  };
  return gradients[color] || "from-blue-500 to-cyan-400";
}