import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login?callbackUrl=/teacher/students");
  }

  if (authUser.role !== "TEACHER") {
    redirect("/");
  }

  return children;
}
