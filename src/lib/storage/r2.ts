import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "path";

const requiredEnvVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const;

let cachedClient: S3Client | null = null;

function getMissingEnvVars() {
  return requiredEnvVars.filter((name) => !process.env[name]);
}

function getR2Client() {
  if (cachedClient) return cachedClient;

  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing R2 configuration: ${missingEnvVars.join(", ")}`);
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

function sanitizeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path.basename(name, extension).replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${baseName || "document"}${extension}`;
}

export function isR2Configured() {
  return getMissingEnvVars().length === 0;
}

export async function uploadFileToR2(options: {
  file: File;
  folder: string;
  fileNamePrefix?: string;
  contentType?: string;
}) {
  const { file, folder, fileNamePrefix, contentType } = options;
  const client = getR2Client();
  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const safeFileName = sanitizeFileName(file.name);
  const prefix = fileNamePrefix ? `${fileNamePrefix}-` : "";
  const key = `${safeFolder}/${prefix}${Date.now()}-${safeFileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType || file.type || "application/octet-stream",
    }),
  );

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");

  return {
    key,
    url: `${publicBaseUrl}/${key}`,
    size: buffer.length,
  };
}
