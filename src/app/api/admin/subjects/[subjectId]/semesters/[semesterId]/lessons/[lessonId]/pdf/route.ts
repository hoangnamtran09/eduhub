import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Upload PDF cho bài học
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; semesterId: string; lessonId: string }> }
) {
  const { subjectId, semesterId, lessonId } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Save PDF
    const uploadsDir = path.join(process.cwd(), "public", "pdfs", "lessons");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    const pdfUrl = `/pdfs/lessons/${fileName}`;

    // Update lesson with PDF URL (cả content và pdfUrl field)
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { 
        content: lesson.content 
          ? lesson.content + `\n\n📄 **PDF:** [Xem sách giáo khoa](${pdfUrl})`
          : `📄 **PDF:** [Xem sách giáo khoa](${pdfUrl})`,
        pdfUrl: pdfUrl
      },
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
      lessonId: updatedLesson.id,
      fileName,
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// Xóa PDF của bài học
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subjectId: string; semesterId: string; lessonId: string }> }
) {
  const { lessonId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get("pdfUrl");

    if (!pdfUrl) {
      return NextResponse.json({ error: "PDF URL is required" }, { status: 400 });
    }

    // Update lesson to remove PDF reference
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        content: "", // Clear content when removing PDF
      },
    });

    return NextResponse.json({
      success: true,
      message: "PDF removed successfully",
    });
  } catch (error) {
    console.error("Delete PDF error:", error);
    return NextResponse.json(
      { error: "Failed to delete PDF" },
      { status: 500 }
    );
  }
}
