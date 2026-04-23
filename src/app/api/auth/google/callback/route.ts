import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function redirectToLogin(error: string) {
  const url = new URL("/login", getBaseUrl());
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = cookies().get("google_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectToLogin("google_state_mismatch");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectToLogin("google_not_configured");
  }

  try {
    const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return redirectToLogin("google_token_failed");
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const profile = (await profileResponse.json()) as GoogleUserInfo;

    if (!profileResponse.ok || !profile.email) {
      console.error("Google profile fetch failed:", profile);
      return redirectToLogin("google_profile_failed");
    }

    const prismaAny = prisma as any;
    let user = await prismaAny.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await prismaAny.user.create({
        data: {
          email: profile.email,
          fullName: profile.name || profile.email.split("@")[0],
          avatarUrl: profile.picture || null,
          role: "STUDENT",
          emailVerified: profile.email_verified ? new Date() : null,
        },
      });

      if (user.role === "STUDENT") {
        await prismaAny.studentProfile.create({
          data: {
            userId: user.id,
          },
        });
      }
    } else {
      user = await prismaAny.user.update({
        where: { id: user.id },
        data: {
          fullName: profile.name || user.fullName,
          avatarUrl: profile.picture || user.avatarUrl,
          emailVerified: profile.email_verified ? (user.emailVerified || new Date()) : user.emailVerified,
        },
      });
    }

    const token = await createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);
    cookies().delete("google_oauth_state");

    return NextResponse.redirect(new URL("/", getBaseUrl()));
  } catch (error) {
    console.error("Google auth callback error:", error);
    return redirectToLogin("google_auth_failed");
  }
}
