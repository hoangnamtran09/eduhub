import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

interface RouteParams {
  params: { subjectId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { subjectId } = params;
    
    // Use any to bypass Prisma type sync issues
    const prismaAny = prisma as any;

    const subject = await prismaAny.subject.findUnique({
      where: { id: subjectId },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
        },
        courses: true,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Transform data - Đơn giản hóa, bỏ qua Semester
    const response = {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      description: subject.description,
      gradient: getGradientFromColor(subject.color || "blue"),
      // Giả lập structure cũ để tương thích với các component cũ nếu có
      courses: [
        {
          id: subject.id,
          title: "Nội dung chính",
          slug: "main-content",
          gradeLevel: 6,
          chapters: (subject.lessons || []).map((lesson: any, idx: number) => ({
            id: lesson.id,
            title: lesson.title,
            order: idx + 1,
            lessons: [{
              id: lesson.id,
              title: lesson.title,
              order: lesson.order,
              duration: lesson.duration || 30,
              hasPdf: !!lesson.pdfUrl,
              hasVideo: !!lesson.videoUrl,
              hasQuiz: false,
            }],
          })),
        }
      ],
      // Structure phẳng cho Learning Page
      lessons: (subject.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        duration: lesson.duration || 30,
        hasPdf: !!lesson.pdfUrl,
        hasVideo: !!lesson.videoUrl,
        hasQuiz: false,
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
