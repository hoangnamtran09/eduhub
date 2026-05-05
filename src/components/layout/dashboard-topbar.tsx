"use client";

import Link from "next/link";
import { UserRoundCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardTopbar() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const needsProfile = user.role === "STUDENT" && (!user.fullName || !user.gradeLevel);

  if (!needsProfile) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100"
      >
        <UserRoundCheck className="h-4 w-4" />
        Hoàn thiện hồ sơ
      </Link>
    </div>
  );
}
