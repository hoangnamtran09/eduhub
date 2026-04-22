import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

function toSlugSegment(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

// GET - Get subject and lessons by subject slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject");
    const lessonId = searchParams.get("lesson");

    // If looking for lesson by slug
    if (lessonId) {
      const lesson = await prisma.lesson.findFirst({
        where: { slug: lessonId },
        include: {
          Chapter: {
            include: {
              Course: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      const allLessons = await prisma.lesson.findMany({
        where: { chapterId: lesson.chapterId ?? undefined },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true, order: true, duration: true },
      });

      const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
      const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
      const nextLesson =
        currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

      const response = {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        content: lesson.content,
        duration: lesson.duration || 0,
        order: lesson.order,
        pdfUrl: lesson.pdfUrl,
        semester: lesson.Chapter
          ? {
              id: lesson.Chapter.id,
              slug: toSlugSegment(lesson.Chapter.title),
              title: lesson.Chapter.title,
              order: lesson.Chapter.order,
            }
          : null,
        subject: {
          id: lesson.Chapter?.Course.subject.id ?? "",
          slug: lesson.Chapter?.Course.subject.slug ?? "",
          name: lesson.Chapter?.Course.subject.name ?? "",
          icon: lesson.Chapter?.Course.subject.icon ?? null,
          color: lesson.Chapter?.Course.subject.color ?? null,
        },
        chapterLessons: allLessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          order: l.order,
          duration: l.duration,
          isCurrent: l.id === lesson.id,
        })),
        navigation: {
          prev: prevLesson
            ? { id: prevLesson.id, slug: prevLesson.slug, title: prevLesson.title }
            : null,
          next: nextLesson
            ? { id: nextLesson.id, slug: nextLesson.slug, title: nextLesson.title }
            : null,
        },
      };

      return NextResponse.json(response);
    }

    // If looking for subject by slug
    if (subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { slug: subjectId },
        include: {
          courses: {
            orderBy: { createdAt: "asc" },
            include: {
              Chapter: {
                orderBy: { order: "asc" },
                include: {
                  Lesson: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }

      const response = {
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        icon: subject.icon,
        description: subject.description,
        gradient: getGradientFromColor(subject.color || "blue"),
        courses: subject.courses.map((course) => ({
          id: course.id,
          slug: course.slug,
          title: course.title,
          gradeLevel: course.gradeLevel,
          chapters: course.Chapter.map((chapter) => ({
            id: chapter.id,
            slug: toSlugSegment(chapter.title),
            title: chapter.title,
            order: chapter.order,
            lessons: chapter.Lesson.map((lesson) => ({
              id: lesson.id,
              slug: lesson.slug,
              title: lesson.title,
              order: lesson.order,
              duration: lesson.duration || 30,
              hasPdf: !!lesson.pdfUrl,
              hasVideo: !!lesson.videoUrl,
              hasQuiz: false,
            })),
          })),
        })),
        semesters: subject.courses.flatMap((course) =>
          course.Chapter.map((chapter) => ({
            id: chapter.id,
            slug: toSlugSegment(chapter.title),
            name: chapter.title,
            lessons: chapter.Lesson.map((lesson) => ({
              id: lesson.id,
              slug: lesson.slug,
              title: lesson.title,
              order: lesson.order,
              duration: lesson.duration || 30,
              hasPdf: !!lesson.pdfUrl,
              hasVideo: !!lesson.videoUrl,
              hasQuiz: false,
            })),
          }))
        ),
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Missing subject or lesson parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching by slug:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
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
