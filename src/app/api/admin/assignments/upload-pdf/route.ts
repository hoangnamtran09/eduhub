import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    const uploadResult = await uploadFileToR2({
      file,
      folder: "pdfs/assignments",
      fileNamePrefix: "assignment",
      contentType: "application/pdf",
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: uploadResult.url,
      storageKey: uploadResult.key,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Assignment PDF upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
