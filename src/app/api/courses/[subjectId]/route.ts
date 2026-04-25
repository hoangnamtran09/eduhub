import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";

interface RouteParams {
  params: { subjectId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { subjectId } = params;
    const authUser = await getAuthUser();
    
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

    const lessonIds = (subject.lessons || []).map((lesson: any) => lesson.id);
    const progressRecords = authUser && lessonIds.length
      ? await prismaAny.lessonProgress.findMany({
          where: {
            userId: authUser.userId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            completed: true,
            completedAt: true,
            status: true,
          },
        })
      : [];
    const progressByLessonId = new Map((progressRecords || []).map((progress: any) => [progress.lessonId, progress]));
    const getLessonProgress = (lessonId: string) => progressByLessonId.get(lessonId) as any | undefined;

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
          chapters: (subject.lessons || []).map((lesson: any, idx: number) => {
            const progress = getLessonProgress(lesson.id);

            return {
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
                completed: Boolean(progress?.completed),
                completedAt: progress?.completedAt ?? null,
                status: progress?.status ?? null,
              }],
            };
          }),
        }
      ],
      // Structure phẳng cho Learning Page
      lessons: (subject.lessons || []).map((lesson: any) => {
        const progress = getLessonProgress(lesson.id);

        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration || 30,
          hasPdf: !!lesson.pdfUrl,
          hasVideo: !!lesson.videoUrl,
          hasQuiz: false,
          completed: Boolean(progress?.completed),
          completedAt: progress?.completedAt ?? null,
          status: progress?.status ?? null,
        };
      }),
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
