import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAllowedPdfHost(url: URL) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (publicBaseUrl) {
    try {
      const configuredHost = new URL(publicBaseUrl).host;
      if (url.host === configuredHost) return true;
    } catch {
      // Ignore invalid config and fall back to hostname checks below.
    }
  }

  return url.hostname.endsWith(".r2.dev") || url.hostname.endsWith(".r2.cloudflarestorage.com");
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (!isAllowedPdfHost(targetUrl)) {
    return NextResponse.json({ error: "URL host is not allowed" }, { status: 403 });
  }

  const response = await fetch(targetUrl.toString(), {
    headers: {
      Range: request.headers.get("range") || "",
    },
  });

  if (!response.ok && response.status !== 206) {
    return NextResponse.json(
      { error: "Failed to fetch PDF" },
      { status: response.status || 502 },
    );
  }

  const headers = new Headers();
  const passthroughHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
    "cache-control",
  ];

  for (const header of passthroughHeaders) {
    const value = response.headers.get(header);
    if (value) headers.set(header, value);
  }

  headers.set("Content-Disposition", "inline");

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
