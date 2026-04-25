import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { isR2Configured, uploadFileToR2 } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Định dạng file không được hỗ trợ. Chấp nhận: PDF, ảnh, Word, Excel, PowerPoint, TXT" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File tối đa 10MB" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 storage is not configured" }, { status: 500 });
    }

    const uploadResult = await uploadFileToR2({
      file,
      folder: `submissions/${authUser.userId}`,
      fileNamePrefix: "assignment-submission",
      contentType: file.type,
    });

    return NextResponse.json({
      name: file.name,
      url: uploadResult.url,
      type: file.type,
      size: file.size,
      storageKey: uploadResult.key,
    });
  } catch (error) {
    console.error("Submission upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
