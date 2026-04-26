"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, GraduationCap, Loader2, UserRoundCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  level: "critical" | "warning" | "info" | "success";
  kind?: "profile" | "assignment_due" | "assignment_feedback" | "study_reminder" | "parent_alert" | "admin_alert";
};

type NotificationPreferences = {
  dailyStudyReminder: boolean;
  newAssignmentNotification: boolean;
  weeklyEmailReport: boolean;
};

function levelClass(level: NotificationItem["level"]) {
  if (level === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function DashboardTopbar() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyStudyReminder: true,
    newAssignmentNotification: true,
    weeklyEmailReport: false,
  });

  useEffect(() => {
    if (!user) return;

    setPreferences({
      dailyStudyReminder: user.dailyStudyReminder ?? true,
      newAssignmentNotification: user.newAssignmentNotification ?? true,
      weeklyEmailReport: user.weeklyEmailReport ?? false,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();
    window.addEventListener("study-progress-updated", loadNotifications);

    return () => {
      cancelled = true;
      window.removeEventListener("study-progress-updated", loadNotifications);
    };
  }, [user]);

  if (!user) return null;

  const needsProfile = user.role === "STUDENT" && (!user.fullName || !user.gradeLevel);
  const visibleNotifications = notifications.filter((item) => {
    if (item.kind === "study_reminder") return preferences.dailyStudyReminder;
    if (item.kind === "assignment_due" || item.kind === "assignment_feedback") return preferences.newAssignmentNotification;
    return true;
  });
  const visibleUnreadCount = visibleNotifications.filter((item) => item.level === "critical" || item.level === "warning").length;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-3 lg:mb-5">
      {needsProfile && (
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
        >
          <UserRoundCheck className="h-4 w-4" />
          Hoàn thiện hồ sơ
        </Link>
      )}

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen((current) => !current)}
          className="relative h-10 w-10 rounded-full border-slate-200 bg-white/90 shadow-sm hover:bg-white"
          aria-label="Mở thông báo"
        >
          <Bell className="h-4 w-4 text-slate-700" />
          {visibleUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {Math.min(visibleUnreadCount, 9)}
            </span>
          )}
        </Button>

        {open && (
          <div role="dialog" aria-label="Thông báo" className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/12">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Trung tâm thông báo</p>
                <p className="text-xs text-slate-500">Những việc cần chú ý hôm nay</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng thông báo" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải thông báo...
                </div>
              ) : visibleNotifications.length ? (
                <div className="space-y-2">
                  {visibleNotifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5 rounded-full border p-1.5", levelClass(item.level))}>
                          {item.level === "success" ? <CheckCircle2 className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-900">Không có việc cần xử lý</p>
                  <p className="mt-1 text-xs text-slate-500">Hệ thống sẽ nhắc khi có bài sắp hạn, feedback mới, hồ sơ thiếu hoặc cảnh báo học tập.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
