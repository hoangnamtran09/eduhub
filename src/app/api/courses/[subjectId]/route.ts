import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

interface RouteParams {
  params: { subjectId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { subjectId } = params;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        semesters: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Transform data - keep courses structure for frontend compatibility
    const response = {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      description: subject.description,
      gradient: getGradientFromColor(subject.color || "blue"),
      // Original courses structure
      courses: subject.semesters.map((semester) => ({
        id: semester.id,
        title: semester.name,
        slug: semester.name.toLowerCase().replace(/\s+/g, "-"),
        gradeLevel: 6,
        chapters: semester.lessons.map((lesson, idx) => ({
          id: lesson.id,
          title: lesson.title,
          order: idx + 1,
          lessons: [{
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration || 30,
            hasPdf: !!lesson.content?.includes('.pdf'),
            hasVideo: !!lesson.videoUrl,
            hasQuiz: false,
          }],
        })),
      })),
      // New semesters structure for 3-column learning page
      semesters: subject.semesters.map((semester) => ({
        id: semester.id,
        name: semester.name,
        lessons: semester.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration || 30,
          hasPdf: !!lesson.content?.includes('.pdf'),
          hasVideo: !!lesson.videoUrl,
          hasQuiz: false,
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
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