import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { beeknoeeClient } from "@/lib/beeknoee/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

interface ParsedLesson {
  title: string;
  content: string;
  type?: string;
}

interface ParsedChapter {
  title: string;
  lessons: ParsedLesson[];
}

interface ProcessResult {
  subjectName: string;
  chapters: ParsedChapter[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfUrl, subjectName, courseTitle, gradeLevel = 6 } = body;

    if (!pdfUrl) {
      return NextResponse.json({ error: "PDF URL is required" }, { status: 400 });
    }

    // Use AI to analyze PDF URL and create course structure
    const aiResponse = await beeknoeeClient.chat.completions.create({
      model: "glm-4.7-flash",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia phân tích sách giáo khoa. Nhiệm vụ:
1. Phân tích cấu trúc sách giáo khoa từ URL/file name
2. Tạo cấu trúc chương và bài học phù hợp
3. Viết nội dung tóm tắt cho mỗi bài học (khoảng 2-3 đoạn)

Trả lời JSON (KHÔNG markdown code block):
{
  "subjectName": "Tên môn học phỏng đoán",
  "chapters": [
    {
      "title": "Tên chương",
      "lessons": [
        {
          "title": "Tên bài",
          "content": "Nội dung bài học tóm tắt...",
          "type": "theory"
        }
      ]
    }
  ]
}

Quy tắc:
- Tạo 2-4 chương, mỗi chương 2-3 bài
- Nội dung bài học phải có ít nhất 2 đoạn văn
- type chỉ là metadata, KHÔNG lưu vào database`
        },
        {
          role: "user",
          content: `Phân tích cấu trúc sách giáo khoa từ: ${pdfUrl}. Môn: ${subjectName || "Tự động nhận diện"}`
        }
      ],
      temperature: 0.5,
    });

    const aiContent = aiResponse.choices[0].message.content || "";
    
    let structuredData: ProcessResult;
    try {
      let cleanJson = aiContent.trim();
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
      structuredData = JSON.parse(cleanJson.trim());
    } catch (parseError) {
      // Default structure if AI fails
      structuredData = {
        subjectName: subjectName || "Môn học",
        chapters: [
          {
            title: "Chương 1",
            lessons: [
              { title: "Bài 1: Giới thiệu", content: "Bài học giới thiệu tổng quan về môn học." }
            ]
          }
        ]
      };
    }

    // Create subject
    const finalSubjectName = subjectName || structuredData.subjectName || "Môn học";
    const subject = await prisma.subject.create({
      data: {
        name: finalSubjectName,
        slug: finalSubjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
        icon: "📚",
        color: "blue",
      }
    });

    // Create course
    const courseSlug = (courseTitle || `${finalSubjectName}-lop-${gradeLevel}`)
      .toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const course = await prisma.course.create({
      data: {
        title: courseTitle || `${finalSubjectName} - Lớp ${gradeLevel}`,
        slug: courseSlug,
        description: `Khóa học ${finalSubjectName} - Lớp ${gradeLevel}`,
        subjectId: subject.id,
        gradeLevel,
        isPublished: true,
        pdfUrl: pdfUrl, // Save the PDF URL
      }
    });

    // Create chapters and lessons
    let chapterOrder = 0;
    let totalLessons = 0;
    
    for (const chapterData of structuredData.chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          order: chapterOrder++,
          courseId: course.id,
        }
      });

      let lessonOrder = 0;
      for (const lessonData of chapterData.lessons) {
        await prisma.lesson.create({
          data: {
            title: lessonData.title?.substring(0, 200) || `Bài ${lessonOrder + 1}`,
            content: lessonData.content || `Nội dung bài học`,
            duration: 30,
            order: lessonOrder++,
            chapterId: chapter.id,
            // Note: type field is not in schema, so we don't save it
          }
        });
        totalLessons++;
      }
    }

    return NextResponse.json({
      success: true,
      subjectId: subject.id,
      courseId: course.id,
      subjectName: finalSubjectName,
      chapters: structuredData.chapters,
      totalLessons,
      message: `Đã tạo ${totalLessons} bài học trong ${chapterOrder} chương`
    });

  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Failed to process content: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}