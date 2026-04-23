import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z } from "zod";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const uploadSchema = z.object({
  subjectName: z.string().trim().min(1).max(120),
});

export async function POST(request: NextRequest) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const subjectNameEntry = formData.get("subjectName");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    const parsed = uploadSchema.safeParse({
      subjectName: typeof subjectNameEntry === "string" ? subjectNameEntry : "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid upload payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const file = fileEntry;

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size must be between 1 byte and 10 MB" },
        { status: 400 },
      );
    }

    const extension = path.extname(file.name).toLowerCase();
    if (extension !== ".pdf" || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured" },
        { status: 500 },
      );
    }

    const normalizedSubject = parsed.data.subjectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "subject";

    const uploadResult = await uploadFileToR2({
      file,
      folder: `uploads/${normalizedSubject}`,
      fileNamePrefix: "document",
      contentType: "application/pdf",
    });

    return NextResponse.json({
      success: true,
      fileUrl: uploadResult.url,
      fileName: file.name,
      subjectName: parsed.data.subjectName,
      storageKey: uploadResult.key,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
