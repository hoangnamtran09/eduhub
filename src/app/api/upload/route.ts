import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { z } from "zod";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const uploadSchema = z.object({
  subjectName: z.string().trim().min(1).max(120),
});

function sanitizeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path.basename(name, extension).replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${baseName || "document"}${extension}`;
}

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

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${sanitizeFileName(file.name)}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return public URL
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      subjectName: parsed.data.subjectName,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
