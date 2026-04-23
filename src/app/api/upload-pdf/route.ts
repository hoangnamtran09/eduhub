import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subjectName = formData.get("subjectName") as string | null;
    const courseTitle = formData.get("courseTitle") as string | null;
    const gradeLevel = parseInt(formData.get("gradeLevel") as string) || 6;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured" },
        { status: 500 },
      );
    }

    const normalizedSubject = (subjectName || "mon-hoc")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mon-hoc";

    const uploadResult = await uploadFileToR2({
      file,
      folder: `pdfs/courses/${normalizedSubject}`,
      fileNamePrefix: "course",
      contentType: "application/pdf",
    });
    const pdfUrl = uploadResult.url;

    const finalSubjectName = subjectName || "Môn học";
    const prismaAny = prisma as any;

    const subject = await prismaAny.subject.create({
      data: {
        name: finalSubjectName,
        slug: `${finalSubjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        icon: "📚",
        color: "blue",
      },
    });

    const course = await prismaAny.course.create({
      data: {
        title: courseTitle || `${finalSubjectName} - Lớp ${gradeLevel}`,
        slug: `course-${Date.now()}`,
        subjectId: subject.id,
        gradeLevel,
        isPublished: true,
        pdfUrl,
        pdfStorageKey: uploadResult.key,
      },
    });

    return NextResponse.json({
      success: true,
      subjectId: subject.id,
      courseId: course.id,
      subjectName: finalSubjectName,
      pdfUrl,
      storageKey: uploadResult.key,
      message: "Đã tải lên PDF khóa học thành công!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
