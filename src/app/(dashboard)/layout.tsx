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
  const isLearningPage = pathname?.includes('/courses/') && pathname?.includes('/lesson') || pathname?.includes('/learn');

  useEffect(() => {
    setMounted(true);
  }, []);


  if (isLearningPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      {/* Main content shifts with sidebar, no header */}
      <div 
        className={cn(
          "transition-all duration-300",
          mounted ? (collapsed ? "pl-20" : "pl-72") : "pl-72"
        )}
      >
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
