"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  GraduationCap,
  Library,
  ClipboardList
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";

const navItems = [
  { href: "/", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/subjects", label: "Quản lý môn học", icon: ClipboardList },
  { href: "/progress", label: "Tiến độ", icon: Trophy },
  { href: "/tutor", label: "Gia sư AI", icon: MessageSquare },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen bg-white border-r border-ink-200/50 w-72" />
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200/60",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Area */}
      <div className="flex items-center h-16 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 leading-tight">
                EduHub
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Học thông minh
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                isActive
                  ? "bg-brand-50 text-brand-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900",
                collapsed && "justify-center px-0"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-500 rounded-r-full" />
              )}
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-all duration-300",
                isActive ? "text-brand-600 scale-110" : "group-hover:text-brand-500"
              )} />
              {!collapsed && (
                <span className={cn(
                  "text-sm font-bold tracking-tight transition-colors",
                  isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"
                )}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Streak Badge - Minimal */}
      {!collapsed && (
        <div className="absolute bottom-24 left-5 right-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm group hover:border-brand-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">Học tập 7 ngày</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-slate-900">Chuỗi: 7</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-1 rounded-full bg-brand-500" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute bottom-10 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all z-50"
      >
        <ChevronLeft className={cn("w-4 h-4 text-slate-500", collapsed && "rotate-180")} />
      </Button>
    </aside>
  );
}
