import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login?callbackUrl=/admin/students");
  }

  if (authUser.role !== "ADMIN") {
    redirect("/");
  }

  return children;
}
