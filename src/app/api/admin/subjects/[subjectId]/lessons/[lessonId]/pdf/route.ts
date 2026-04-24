import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { validatePdfFile } from "@/lib/upload/pdf-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { subjectId: string; lessonId: string } }
) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { lessonId } = params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pdfError = await validatePdfFile(file);
    if (pdfError) {
      return NextResponse.json({ error: pdfError }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured" },
        { status: 500 },
      );
    }

    const uploadResult = await uploadFileToR2({
      file,
      folder: `pdfs/lessons/${lessonId}`,
      fileNamePrefix: lessonId,
      contentType: "application/pdf",
    });
    const pdfUrl = uploadResult.url;

    // Update lesson
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        pdfUrl,
        pdfStorageKey: uploadResult.key,
      }
    });

    return NextResponse.json({ 
      success: true, 
      pdfUrl, 
      storageKey: uploadResult.key,
      message: "Đã tải lên PDF bài học thành công" 
    });
  } catch (error) {
    console.error("Lesson PDF upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
