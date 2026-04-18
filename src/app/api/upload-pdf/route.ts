import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { beeknoeeClient } from "@/lib/beeknoee/client";
import { writeFile, mkdir, cp } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

interface ParsedLesson {
  title: string;
  startPage: number;
  endPage: number;
  type: "theory" | "exercise" | "quiz";
  content: string;
}

interface ParsedChapter {
  title: string;
  startPage: number;
  endPage: number;
  lessons: ParsedLesson[];
}

interface ProcessResult {
  subjectName: string;
  totalPages: number;
  chapters: ParsedChapter[];
}

// Extract text from PDF using raw parsing
function extractPdfText(buffer: Buffer): { pages: string[]; totalPages: number } {
  const content = buffer.toString("latin1");
  const pages: string[] = [];
  const pageSplits = content.split("/Type /Page\n");
  
  for (let i = 1; i < pageSplits.length; i++) {
    const streamMatch = pageSplits[i].match(/stream([\s\S]*?)endstream/);
    if (streamMatch) {
      const text = streamMatch[1]
        .replace(/[\(\)]/g, " ")
        .replace(/\\n/g, "\n")
        .replace(/\\/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 50) {
        pages.push(text);
      }
    }
  }
  
  return { pages, totalPages: pages.length || 1 };
}

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

    // Extract PDF content using LangChain Backend OCR (Vision)
    let fullText = "";
    let totalPages = 0;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const ocrFormData = new FormData();
      // Re-create a file-like object from buffer for the backend
      const blob = new Blob([buffer], { type: "application/pdf" });
      ocrFormData.append("file", blob, file.name);

      const ocrResponse = await fetch(`${backendUrl}/extract-pdf`, {
        method: "POST",
        body: ocrFormData,
      });

      if (ocrResponse.ok) {
        const ocrData = await ocrResponse.json();
        fullText = ocrData.extracted_text;
        // Count pages based on marker "--- TRANG X ---"
        totalPages = (fullText.match(/--- TRANG \d+ ---/g) || []).length;
      }
    } catch (e) {
      console.error("Backend OCR failed, falling back to basic extraction:", e);
      try {
        const pdfInfo = extractPdfText(buffer);
        fullText = pdfInfo.pages.join("\n\n");
        totalPages = pdfInfo.totalPages;
      } catch (innerE) {
        console.error("Fallback extraction also failed:", innerE);
      }
    }

    const sampleContent = fullText.substring(0, 10000);
    if (totalPages === 0) totalPages = 1;

    // AI: Extract chapters and lessons from PDF content
    let aiContent = "";
    for (let retry = 0; retry < 3; retry++) {
      try {
        const aiResponse = await beeknoeeClient.chat.completions.create({
          model: "glm-4.7-flash",
          max_tokens: 4000,
          messages: [
            {
              role: "system",
              content: `Bạn là chuyên gia phân tích sách giáo khoa Việt Nam.

Nhiệm vụ: Đọc nội dung sách và trích xuất CẤU TRÚC CHƯƠNG + BÀI HỌC chính xác.

QUY TẮC:
- Sách giáo khoa VN: "CHƯƠNG I" → "Bài 1", "Bài 2"...
- Ví dụ: "Chương I - Hàm số lượng giác và phương trình lượng giác", "Bài 1. Hàm số lượng giác"
- Mỗi bài học nên 5-15 trang
- VỚI MỖI BÀI: viết 2-3 câu tóm tắt nội dung chính

Trả về JSON (KHÔNG có markdown):
{
  "subjectName": "Tên môn học",
  "totalPages": SỐ_TRANG,
  "chapters": [
    {
      "title": "Chương I - Tên chương",
      "startPage": 1,
      "endPage": 25,
      "lessons": [
        {
          "title": "Bài 1. Tên bài",
          "startPage": 1,
          "endPage": 10,
          "type": "theory",
          "content": "Tóm tắt 2-3 câu nội dung bài học này"
        }
      ]
    }
  ]
}`
            },
            {
              role: "user",
              content: `Đọc sách giáo khoa ${totalPages} trang sau và trích xuất cấu trúc chương/bài:

NỘI DUNG PDF:\n${sampleContent}\n\nTên file: ${file.name}\n\nTrích xuất TẤT CẢ chương và bài học với page ranges và tóm tắt nội dung.`
            }
          ],
          temperature: 0.2,
        });
        aiContent = aiResponse.choices[0].message.content || "";
        break;
      } catch (e: any) {
        if (retry === 2) throw e;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Parse AI response
    let structuredData: ProcessResult;
    try {
      let cleanJson = aiContent.trim();
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
      structuredData = JSON.parse(cleanJson.trim());
    } catch {
      structuredData = {
        subjectName: subjectName || "Môn học",
        totalPages,
        chapters: [
          { 
            title: "Chương 1", 
            startPage: 1, 
            endPage: Math.ceil(totalPages / 2),
            lessons: [{ title: "Bài 1", startPage: 1, endPage: Math.ceil(totalPages / 2), type: "theory" as const, content: "Bài học đầu tiên" }]
          }
        ]
      };
    }

    // Create database records
    const finalSubjectName = subjectName || structuredData.subjectName || "Môn học";
    const subject = await prisma.subject.create({
      data: { 
        name: finalSubjectName, 
        slug: finalSubjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), 
        icon: "📚", 
        color: "blue" 
      }
    });

    // In current schema, Course belongs to Semester, Semester belongs to Subject.
    // Let's create a default Semester first.
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
        gradeLevel, 
        isPublished: true, 
        pdfUrl 
      }
    });

    // Convert PDF to images and OCR
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const outputDir = path.join(process.cwd(), "public", "pdfs", "pages", course.id);
      
      // Create directory for pages
      await mkdir(outputDir, { recursive: true });
      
      // Copy PDF to temp location for backend processing
      const tempPdfPath = path.join(process.cwd(), "public", "pdfs", fileName);
      
      // Call backend to convert PDF to images and OCR
      const convertFormData = new FormData();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      convertFormData.append("file", pdfBlob, file.name);
      convertFormData.append("course_id", course.id);
      convertFormData.append("output_dir", outputDir);

      const convertResponse = await fetch(`${backendUrl}/convert-pdf-to-images`, {
        method: "POST",
        body: convertFormData,
      });

      if (convertResponse.ok) {
        const convertData = await convertResponse.json();
        
        // Save PDF pages to database
        if (convertData.pages && convertData.pages.length > 0) {
          await prisma.pDFPage.createMany({
            data: convertData.pages.map((page: { pageNumber: number; imageUrl: string; ocrText: string }) => ({
              courseId: course.id,
              pageNumber: page.pageNumber,
              imageUrl: page.imageUrl,
              ocrText: page.ocrText || null,
            })),
            skipDuplicates: true,
          });
        }
      }
    } catch (e) {
      console.error("PDF to images conversion failed:", e);
      // Continue without image conversion - not critical
    }

    let totalLessons = 0;
    const lessons: { id: string; title: string; startPage: number; endPage: number; pdfUrl: string }[] = [];
    let lessonOrder = 0;
    let chapterOrder = 0;

    for (const chapterData of structuredData.chapters) {
      chapterOrder++;
      // Note: Chapter model is NOT in schema.prisma. 
      // We will create Lessons directly under the Semester, 
      // incorporating Chapter title into Lesson title if needed.
      
      for (const lessonData of chapterData.lessons) {
        const startPage = lessonData.startPage || 1;
        const endPage = lessonData.endPage || startPage + 5;
        
        const fullLessonTitle = `${chapterData.title}: ${lessonData.title}`;

        // Create lesson content with PDF link
        const lessonContent = `📖 **${fullLessonTitle}**

📄 Trang ${startPage} - ${endPage} trong sách giáo khoa

${lessonData.content || "Nội dung bài học"}

---

📚 **Hướng dẫn học tập:**
1. Đọc nội dung trong sách (trang ${startPage}-${endPage})
2. Chú ý các khái niệm và công thức quan trọng
3. Làm bài tập cuối chương để củng cố

📄 **Xem PDF:** [Mở sách giáo khoa](/pdfs/${fileName})

---

*Bài học này là một phần của khóa học "${course.title}"*`;

        const lesson = await prisma.lesson.create({
          data: { 
            title: fullLessonTitle.substring(0, 200), 
            content: lessonContent,
            duration: (endPage - startPage + 1) * 5,
            order: lessonOrder++, 
            semesterId: semester.id,
            type: "theory"
          }
        });
        lessons.push({ 
          id: lesson.id, 
          title: lesson.title, 
          startPage, 
          endPage,
          pdfUrl 
        });
        totalLessons++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      subjectId: subject.id, 
      courseId: course.id, 
      subjectName: finalSubjectName, 
      pdfUrl, 
      totalPages,
      chapters: structuredData.chapters, 
      lessons, 
      totalLessons, 
      message: `Đã tạo khóa học "${course.title}" với ${totalLessons} bài học trong ${chapterOrder} chương` 
    });

  } catch (error) {
    console.error("Upload PDF error:", error);
    return NextResponse.json({ error: "Failed to process PDF: " + (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}