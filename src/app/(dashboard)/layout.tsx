"use client";

import { Sidebar } from "@/components/layout/sidebar";
// import { Header } from "@/components/layout/header";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebarStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Hide sidebar for learning pages
  // Match /courses/[subjectId]/[lessonId] or /learn
  const isLearningPage = 
    (pathname?.startsWith('/courses/') && pathname.split('/').filter(Boolean).length >= 3) || 
    pathname?.startsWith('/learn');

  useEffect(() => {
    setMounted(true);
    if (isLearningPage) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [isLearningPage]);


  if (isLearningPage) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900">
      <Sidebar />
      {/* Main content shifts with sidebar, no header */}
      <div 
        className={cn(
          "transition-all duration-300",
          mounted ? (collapsed ? "pl-20" : "pl-72") : "pl-72"
        )}
      >
        <main className="p-4 lg:p-6">
          <div className="min-h-[calc(100vh-2rem)] rounded-[32px] border border-white/70 bg-white/65 p-4 shadow-panel backdrop-blur-xl lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
