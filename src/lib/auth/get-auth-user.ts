import { jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getJwtSecret } from "@/lib/auth/jwt-secret";

export interface AuthUser {
  userId: string;
  role: string;
  email?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Fast path: read user context injected by middleware as request headers.
    // This avoids re-verifying the JWT on every API call.
    const headersList = headers();
    const headerUserId = headersList.get("x-user-id");
    const headerRole = headersList.get("x-user-role");

    if (headerUserId && headerRole) {
      return {
        userId: headerUserId,
        role: headerRole,
        email: headersList.get("x-user-email") || undefined,
      };
    }

    // Fallback: verify JWT directly (e.g. for auth/me or when middleware didn't run)
    const token = cookies().get("token")?.value;
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, getJwtSecret());

    return {
      userId: payload.userId as string,
      role: payload.role as string,
      email: payload.email as string | undefined,
    };
  } catch {
    return null;
  }
}
