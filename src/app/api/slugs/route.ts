import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// GET - Get subject and lessons by subject slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get("subject");
    const lessonSlug = searchParams.get("lesson");

    // If looking for lesson by slug
    if (lessonSlug) {
      const lesson = await prisma.lesson.findFirst({
        where: { slug: lessonSlug },
        include: {
          semester: {
            include: {
              subject: true,
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  order: true,
                  duration: true,
                },
              },
            },
          },
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      // Get all lessons in semester for navigation
      const allLessons = await prisma.lesson.findMany({
        where: { semesterId: lesson.semesterId },
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
        semester: {
          id: lesson.semester.id,
          slug: lesson.semester.name.toLowerCase().replace(/\s+/g, "-"),
          title: lesson.semester.name,
          order: lesson.semester.order,
        },
        subject: {
          id: lesson.semester.subject.id,
          slug: lesson.semester.subject.slug,
          name: lesson.semester.subject.name,
          icon: lesson.semester.subject.icon,
          color: lesson.semester.subject.color,
        },
        chapterLessons: lesson.semester.lessons.map((l) => ({
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
    if (subjectSlug) {
      const subject = await prisma.subject.findUnique({
        where: { slug: subjectSlug },
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

      const response = {
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        icon: subject.icon,
        description: subject.description,
        gradient: getGradientFromColor(subject.color || "blue"),
        courses: subject.semesters.map((semester) => ({
          id: semester.id,
          slug: semester.name.toLowerCase().replace(/\s+/g, "-"),
          title: semester.name,
          gradeLevel: 6,
          chapters: semester.lessons.map((lesson, idx) => ({
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            order: idx + 1,
            lessons: [
              {
                id: lesson.id,
                slug: lesson.slug,
                title: lesson.title,
                order: lesson.order,
                duration: lesson.duration || 30,
                hasPdf: !!lesson.pdfUrl,
                hasVideo: !!lesson.videoUrl,
                hasQuiz: false,
              },
            ],
          })),
        })),
        semesters: subject.semesters.map((semester) => ({
          id: semester.id,
          slug: semester.name.toLowerCase().replace(/\s+/g, "-"),
          name: semester.name,
          lessons: semester.lessons.map((lesson) => ({
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