import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";





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

    // Save PDF
    const uploadsDir = path.join(process.cwd(), "public", "pdfs");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    const pdfUrl = `/pdfs/${fileName}`;

    // Create subject, semester, course
    const finalSubjectName = subjectName || "Môn học";
    const subject = await prisma.subject.create({
      data: { 
        name: finalSubjectName, 
        slug: finalSubjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), 
        icon: "📚", 
        color: "blue" 
      }
    });

    const semester = await prisma.semester.create({
      data: {
        name: "Học kì 1",
        subjectId: subject.id,
        order: 1,
      }
    });

    const course = await prisma.course.create({
      data: { 
        title: courseTitle || `${finalSubjectName} - Lớp ${gradeLevel}`, 
        slug: `course-${Date.now()}`, 
        semesterId: semester.id, 
        subjectId: subject.id,
        gradeLevel, 
        isPublished: true, 
        pdfUrl 
      }
    });

    // Convert PDF to images (no OCR)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const outputDir = path.join(process.cwd(), "public", "pdfs", "pages", course.id);
      await mkdir(outputDir, { recursive: true });
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      const convertFormData = new FormData();
      convertFormData.append("file", pdfBlob, file.name);
      convertFormData.append("course_id", course.id);
      convertFormData.append("output_dir", outputDir);

      // Backend chỉ chuyển PDF thành ảnh, không OCR
      const convertResponse = await fetch(`${backendUrl}/convert-pdf-to-images`, {
        method: "POST",
        body: convertFormData,
      });

      if (convertResponse.ok) {
        const convertData = await convertResponse.json();
        if (convertData.pages && convertData.pages.length > 0) {
          await prisma.pDFPage.createMany({
            data: convertData.pages.map((page: { pageNumber: number; imageUrl: string }) => ({
              courseId: course.id,
              pageNumber: page.pageNumber,
              imageUrl: page.imageUrl,
              ocrText: null,
            })),
            skipDuplicates: true,
          });
        }
      }
    } catch (e) {
      console.error("PDF to images conversion failed:", e);
    }

    // Không tạo lesson tự động, chỉ trả về thông tin PDF và các trang ảnh
    return NextResponse.json({ 
      success: true, 
      subjectId: subject.id, 
      courseId: course.id, 
      subjectName: finalSubjectName, 
      pdfUrl, 
      message: `Đã upload và chuyển PDF thành ảnh thành công!` 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }