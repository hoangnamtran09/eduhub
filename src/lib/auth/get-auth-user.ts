import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/auth/jwt-secret";

export interface AuthUser {
  userId: string;
  role: string;
  email?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
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
