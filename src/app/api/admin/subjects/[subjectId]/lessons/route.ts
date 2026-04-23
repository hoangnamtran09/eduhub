import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

const lessonMutationSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().optional().default(""),
  type: z.string().trim().min(1).max(40).optional().default("theory"),
  duration: z.coerce.number().int().min(1).max(600).optional().nullable(),
  videoUrl: z.union([z.string().trim().url(), z.literal(""), z.null()]).optional(),
});

const lessonUpdateSchema = lessonMutationSchema.extend({
  order: z.coerce.number().int().min(1).max(10_000).optional(),
  isPublished: z.boolean().optional(),
});

// GET /api/admin/subjects/[subjectId]/lessons - Lấy danh sách bài học
export async function GET(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  const { subjectId } = params;
  try {
    const prismaAny = prisma as any;
    const lessons = await prismaAny.lesson.findMany({
      where: { subjectId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/subjects/[subjectId]/lessons - Tạo bài học mới
export async function POST(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  const { subjectId } = params;
  try {
    const parsed = lessonMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid lesson payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { title, content, type, duration, videoUrl } = parsed.data;

    const prismaAny = prisma as any;
    const maxOrderLesson = await prismaAny.lesson.findFirst({
      where: { subjectId },
      orderBy: { order: "desc" },
    });

    const order = (maxOrderLesson?.order ?? 0) + 1;

    const lesson = await prismaAny.lesson.create({
      data: {
        subjectId,
        title,
        content: content || "",
        type: type || "theory",
        order,
        duration: duration ?? null,
        videoUrl: videoUrl || null,
        isPublished: true,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subjects/[subjectId]/lessons - Cập nhật bài học
export async function PUT(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const parsed = lessonUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid lesson payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { title, content, type, duration, videoUrl, order, isPublished } = parsed.data;

    const prismaAny = prisma as any;
    const lesson = await prismaAny.lesson.update({
      where: { id },
      data: {
        title,
        content,
        type,
        duration: duration ?? null,
        videoUrl: videoUrl || null,
        order,
        isPublished,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subjects/[subjectId]/lessons - Xóa bài học
export async function DELETE(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    await prismaAny.aICo.deleteMany({ where: { lessonId: id } });
    await prismaAny.lesson.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
