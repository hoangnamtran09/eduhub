import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/auth/jwt-secret";

export async function createAuthToken(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(getJwtSecret());
}

export async function setAuthCookie(token: string) {
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}
