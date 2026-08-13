import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { getJwtSecret } from "@/lib/auth/jwt-secret";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const callbackUrl = `${pathname}${request.nextUrl.search}`;

  // Public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.userId as string;
    const userRole = payload.role as string;
    const userEmail = payload.email as string | undefined;

    // Admin routes protection
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (pathname.startsWith("/teacher") || pathname.startsWith("/api/teacher")) {
      if (userRole !== "TEACHER") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Student-only routes
    if (
      pathname.startsWith("/courses") ||
      pathname.startsWith("/learn") ||
      pathname.startsWith("/progress") ||
      pathname.startsWith("/roadmap") ||
      pathname.startsWith("/mistakes")
    ) {
      if (userRole !== "STUDENT") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Parent-only routes
    if (pathname.startsWith("/child")) {
      if (userRole !== "PARENT") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Shared routes: STUDENT or PARENT
    if (pathname.startsWith("/assignments")) {
      if (userRole !== "STUDENT" && userRole !== "PARENT") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Inject user context into request headers so route handlers
    // can read auth info without re-verifying the JWT
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-role", userRole);
    if (userEmail) {
      requestHeaders.set("x-user-email", userEmail);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (error) {
    // Invalid token
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
