import { NextResponse } from "next/server";
import { getAuthUser, type AuthUser } from "@/lib/auth/get-auth-user";

type AllowedRole = "ADMIN" | "TEACHER";

interface AuthorizedResult {
  authUser: AuthUser;
}

export async function requireRole(
  allowedRoles: AllowedRole[],
): Promise<AuthorizedResult | NextResponse> {
  const authUser = await getAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowedRoles.includes(authUser.role as AllowedRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { authUser };
}

export async function requireAdminOrTeacher() {
  return requireRole(["ADMIN", "TEACHER"]);
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireTeacher() {
  return requireRole(["TEACHER"]);
}
