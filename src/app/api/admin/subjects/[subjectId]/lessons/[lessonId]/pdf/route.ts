import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: { subjectId: string; lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    // Save PDF
    const uploadsDir = path.join(process.cwd(), "public", "pdfs", "lessons");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileName = `${lessonId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    const pdfUrl = `/pdfs/lessons/${fileName}`;

    // Update lesson
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { pdfUrl }
    });

    return NextResponse.json({ 
      success: true, 
      pdfUrl, 
      message: "Đã tải lên PDF bài học thành công" 
    });
  } catch (error) {
    console.error("Lesson PDF upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
