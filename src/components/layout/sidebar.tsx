"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  Flame,
  GraduationCap,
  Library,
  ClipboardList,
  NotebookPen,
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
  { href: "/tutor", label: "Gia sư AI", icon: MessageSquare },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

const adminNavItems = [
  { href: "/admin/students", label: "Quản lý học sinh", icon: Library },
  { href: "/admin/subjects", label: "Quản lý môn học", icon: ClipboardList },
  { href: "/admin/assignments", label: "Giao bài tập", icon: NotebookPen },
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
  const navItems = user?.role === "ADMIN" ? adminNavItems : defaultNavItems;

  useEffect(() => {
    setMounted(true);
  }, []);

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
        "fixed left-0 top-0 z-40 h-screen border-r border-white/60 bg-paper-100/85 backdrop-blur-xl",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-20 items-center border-b border-white/70 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/15">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-ink-900">
                EduHub
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Admin Panel
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
                   "animate-pulse rounded-2xl bg-ink-200/70",
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
                      ? "border-brand-200 bg-white text-ink-900 shadow-soft"
                      : "text-ink-600 hover:border-white hover:bg-white/80 hover:text-ink-900 hover:shadow-soft",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-2 top-2 bottom-2 w-1 rounded-full bg-brand-400" />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-brand-600" : "group-hover:text-ink-900"
                  )} />
                  {!collapsed && (
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isActive ? "text-ink-900" : "text-ink-600 group-hover:text-ink-900"
                    )}>{item.label}</span>
                  )}
                </Link>
              );
            })}
      </nav>

      <div className={cn("absolute left-5 right-5", collapsed ? "bottom-24 left-3 right-3" : "bottom-24")}>
        {!collapsed && user?.role !== "ADMIN" && (
          <div className="rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
                <Flame className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Học tập 7 ngày</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-ink-900">Chuỗi: 7</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-1 w-1 rounded-full bg-brand-400" />
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
            "mt-3 w-full border-white/80 bg-white/90 text-ink-700 hover:bg-white hover:text-ink-900 hover:shadow-soft",
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
        className="absolute bottom-10 right-0 z-50 h-10 w-10 translate-x-1/2 border border-white/90 bg-white shadow-soft transition-all hover:bg-paper-50 hover:border-brand-200"
      >
        <ChevronLeft className={cn("h-4 w-4 text-ink-500", collapsed && "rotate-180")} />
      </Button>
    </aside>
  );
}
