"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Settings,
  ChevronDown,
  ChevronLeft,
  Flame,
  GraduationCap,
  Library,
  ClipboardList,
  NotebookPen,
  Medal,
  LogOut,
  BrainCircuit,
  Route,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";

type NavLeafItem = {
  href: string;
  label: string;
  icon: any;
};

type NavGroupItem = {
  label: string;
  icon: any;
  children: NavLeafItem[];
};

const defaultNavItems = [
  { href: "/", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/assignments", label: "Bài tập", icon: NotebookPen },
  { href: "/mistakes", label: "Điểm yếu", icon: BrainCircuit },
  { href: "/roadmap", label: "Roadmap", icon: Route },
  { href: "/progress", label: "Tiến độ", icon: Trophy },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

const adminNavItems = [
  { href: "/admin/students", label: "Quản lý học sinh", icon: Library },
  { href: "/admin/subjects", label: "Quản lý môn học", icon: ClipboardList },
  { href: "/admin/assignments", label: "Giao bài tập", icon: NotebookPen },
];

const parentNavItems = [
  { href: "/", label: "Tổng quan phụ huynh", icon: LayoutDashboard },
  { href: "/assignments", label: "Bài tập", icon: NotebookPen },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

const adminNavGroups: NavGroupItem[] = [
  {
    label: "Quản lí bổ sung",
    icon: Settings,
    children: [
      { href: "/admin/achievements", label: "Quản lý thành tựu", icon: Medal },
    ],
  },
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Quản lí bổ sung": true,
  });
  const navItems = user?.role === "ADMIN"
    ? adminNavItems
    : user?.role === "PARENT"
      ? parentNavItems
      : defaultNavItems;

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

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    setOpenGroups(() => {
      const nextState: Record<string, boolean> = {};

      adminNavGroups.forEach((group) => {
        nextState[group.label] = group.children.some((item) => pathname.startsWith(item.href));
      });

      return nextState;
    });
  }, [pathname, user?.role]);

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

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98)_0%,rgba(20,41,58,0.96)_42%,rgba(21,63,61,0.94)_100%)] text-white backdrop-blur-xl lg:h-screen lg:border-r",
        "h-16 w-full border-b lg:w-auto",
        collapsed ? "lg:w-20" : "lg:w-72"
      )}
    >
      <div className="flex h-16 items-center border-white/10 px-4 lg:h-20 lg:border-b lg:px-6">
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

      <nav className="hidden space-y-2 px-3 py-5 lg:block">
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

        {!mounted || isAuthLoading || user?.role !== "ADMIN" || collapsed
          ? null
          : adminNavGroups.map((group) => {
              const Icon = group.icon;
              const isGroupActive = group.children.some((item) => pathname.startsWith(item.href));
              const isOpen = openGroups[group.label] ?? false;

              return (
                <div key={group.label} className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition-all duration-200",
                      isGroupActive
                        ? "border-white/16 bg-white/8 text-white"
                        : "text-white/72 hover:border-white/10 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isGroupActive ? "text-accent-300" : "text-white/72")} />
                    <span className="flex-1 text-sm font-medium">{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>

                  {isOpen && (
                    <div className="ml-4 space-y-2 border-l border-white/10 pl-4">
                      {group.children.map((item) => {
                        const ChildIcon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 transition-all duration-200",
                              isActive
                                ? "border-white/20 bg-white/12 text-white shadow-soft backdrop-blur-sm"
                                : "text-white/68 hover:border-white/10 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            <ChildIcon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-accent-300" : "group-hover:text-white")} />
                            <span className={cn("text-sm font-medium", isActive ? "text-white" : "text-white/72 group-hover:text-white")}>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
      </nav>

      <div className={cn("absolute left-5 right-5 hidden lg:block", collapsed ? "bottom-24 left-3 right-3" : "bottom-24")}>
        {!collapsed && user?.role !== "ADMIN" && (
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-soft transition-all backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-accent-500/14">
                {user?.role === "PARENT" ? (
                  <ShieldAlert className="h-5 w-5 text-accent-300" />
                ) : (
                  <Flame className="h-5 w-5 text-accent-300" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {user?.role === "PARENT" ? "Ưu tiên theo dõi" : "Chuỗi học hiện tại"}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-white">
                    {user?.role === "PARENT" ? "Bài tập và cảnh báo" : `Chuỗi: ${streakDays}`}
                  </span>
                  {user?.role !== "PARENT" && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(3, streakDays) }).map((_, i) => (
                         <div key={i} className="h-1 w-1 rounded-full bg-brand-300" />
                      ))}
                    </div>
                  )}
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
        className="absolute right-4 top-3 z-50 h-10 w-10 border border-white/10 bg-ink-900 text-white shadow-soft transition-all hover:bg-ink-800 hover:text-white focus-visible:ring-white/40 focus-visible:ring-offset-0 lg:bottom-10 lg:right-0 lg:top-auto lg:translate-x-1/2"
      >
        <ChevronLeft className={cn("h-4 w-4 text-white", collapsed && "rotate-180")} />
      </Button>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 gap-1 border-t border-white/10 bg-ink-900/95 px-2 py-2 text-white backdrop-blur-xl lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium",
                isActive ? "bg-white/12 text-white" : "text-white/65",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-accent-300")} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
