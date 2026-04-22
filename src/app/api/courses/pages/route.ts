import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        pdfUrl: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const pages = course.pdfUrl
      ? [
          {
            pageNumber: 1,
            imageUrl: course.pdfUrl,
            ocrText: null,
          },
        ]
      : [];

    return NextResponse.json({
      success: true,
      totalPages: pages.length,
      pages,
    });
  } catch (error) {
    console.error("Error fetching PDF pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF pages" },
      { status: 500 }
    );
  }
}
