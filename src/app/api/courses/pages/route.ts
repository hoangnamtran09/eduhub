import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Fetch PDF pages for this course
    const pdfPages = await prisma.pDFPage.findMany({
      where: { courseId },
      orderBy: { pageNumber: "asc" },
      select: {
        pageNumber: true,
        imageUrl: true,
        ocrText: true,
      },
    });

    return NextResponse.json({
      success: true,
      totalPages: pdfPages.length,
      pages: pdfPages,
    });
  } catch (error) {
    console.error("Error fetching PDF pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF pages" },
      { status: 500 }
    );
  }
}
