import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";
import { validatePdfFile } from "@/lib/upload/pdf-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getLessonTitleFromFileName(fileName: string) {
  const extension = path.extname(fileName);
  return path.basename(fileName, extension).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Bài học PDF";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subjectId: string } },
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { subjectId } = params;
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 30) {
      return NextResponse.json({ error: "You can upload up to 30 PDF files at once" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 storage is not configured" }, { status: 500 });
    }

    const prismaAny = prisma as any;
    const subject = await prismaAny.subject.findUnique({ where: { id: subjectId } });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    for (const file of files) {
      const pdfError = await validatePdfFile(file);
      if (pdfError) {
        return NextResponse.json({ error: `${file.name}: ${pdfError}` }, { status: 400 });
      }
    }

    const maxOrderLesson = await prismaAny.lesson.findFirst({
      where: { subjectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let nextOrder = (maxOrderLesson?.order ?? 0) + 1;
    const createdLessons = [];

    for (const file of files) {
      const title = getLessonTitleFromFileName(file.name);
      const lesson = await prismaAny.lesson.create({
        data: {
          subjectId,
          title,
          content: "",
          type: "theory",
          order: nextOrder,
          duration: null,
          videoUrl: null,
          isPublished: true,
        },
      });

      nextOrder += 1;

      const uploadResult = await uploadFileToR2({
        file,
        folder: `pdfs/lessons/${lesson.id}`,
        fileNamePrefix: lesson.id,
        contentType: "application/pdf",
      });

      const updatedLesson = await prismaAny.lesson.update({
        where: { id: lesson.id },
        data: {
          pdfUrl: uploadResult.url,
          pdfStorageKey: uploadResult.key,
        },
      });

      createdLessons.push(updatedLesson);
    }

    return NextResponse.json({
      success: true,
      count: createdLessons.length,
      lessons: createdLessons,
      message: `Đã tạo ${createdLessons.length} bài học từ PDF`,
    });
  } catch (error) {
    console.error("Bulk lesson PDF upload error:", error);
    return NextResponse.json({ error: "Failed to upload lesson PDFs" }, { status: 500 });
  }
}
