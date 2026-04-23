"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Settings,
  ChevronLeft,
  Flame,
  GraduationCap,
  Library,
  ClipboardList,
  NotebookPen,
  Medal,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";

const defaultNavItems = [
  { href: "/", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/assignments", label: "Bài tập", icon: NotebookPen },
  { href: "/progress", label: "Tiến độ", icon: Trophy },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

const adminNavItems = [
  { href: "/admin/students", label: "Quản lý học sinh", icon: Library },
  { href: "/admin/subjects", label: "Quản lý môn học", icon: ClipboardList },
  { href: "/admin/assignments", label: "Giao bài tập", icon: NotebookPen },
  { href: "/admin/achievements", label: "Quản lý thành tựu", icon: Medal },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const navItems = user?.role === "ADMIN" ? adminNavItems : defaultNavItems;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || user.role === "ADMIN") return;

    let cancelled = false;

    const loadProgressSummary = async () => {
      try {
        const response = await fetch("/api/progress");
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled) {
          setStreakDays(Number(data?.stats?.streakDays || 0));
        }
      } catch (error) {
        console.error("Failed to load streak summary:", error);
      }
    };

    loadProgressSummary();

    return () => {
      cancelled = true;
    };
  }, [pathname, user]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      logout();
      router.push("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98)_0%,rgba(20,41,58,0.96)_42%,rgba(21,63,61,0.94)_100%)] text-white backdrop-blur-xl",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/15">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-white">
                EduHub
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
                Learning OS
              </span>
            </div>
          )}
        </Link>
      </div>

      <nav className="space-y-2 px-3 py-5">
        {!mounted || isAuthLoading
          ? Array.from({ length: collapsed ? 5 : 6 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                    "animate-pulse rounded-2xl bg-white/10",
                   collapsed ? "mx-auto h-12 w-12" : "h-12 w-full"
                )}
              />
            ))
          : navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 transition-all duration-200",
                    isActive
                      ? "border-white/20 bg-white/12 text-white shadow-soft backdrop-blur-sm"
                      : "text-white/72 hover:border-white/10 hover:bg-white/8 hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-2 top-2 bottom-2 w-1 rounded-full bg-accent-400" />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-accent-300" : "group-hover:text-white"
                  )} />
                  {!collapsed && (
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isActive ? "text-white" : "text-white/72 group-hover:text-white"
                    )}>{item.label}</span>
                  )}
                </Link>
              );
            })}
      </nav>

      <div className={cn("absolute left-5 right-5", collapsed ? "bottom-24 left-3 right-3" : "bottom-24")}>
        {!collapsed && user?.role !== "ADMIN" && (
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-soft transition-all backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-accent-500/14">
                <Flame className="h-5 w-5 text-accent-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Chuỗi học hiện tại</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-white">Chuỗi: {streakDays}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(3, streakDays) }).map((_, i) => (
                       <div key={i} className="h-1 w-1 rounded-full bg-brand-300" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "mt-3 w-full border-white/10 bg-white/8 text-white hover:bg-white/12 hover:text-white focus-visible:ring-white/40 focus-visible:ring-offset-0",
            collapsed && "h-12 px-0"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>}
        </Button>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute bottom-10 right-0 z-50 h-10 w-10 translate-x-1/2 border border-white/10 bg-ink-900 text-white shadow-soft transition-all hover:bg-ink-800 hover:text-white focus-visible:ring-white/40 focus-visible:ring-offset-0"
      >
        <ChevronLeft className={cn("h-4 w-4 text-white", collapsed && "rotate-180")} />
      </Button>
    </aside>
  );
}
