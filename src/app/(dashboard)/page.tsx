"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Play,
  Sparkles,
  Users,
  GraduationCap,
  BarChart3,
  ChevronRight,
  Loader2,
  CheckCircle,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Types
interface StudySessionItem {
  id: string;
  durationSec: number;
  startedAt: string;
  lesson?: {
    id: string;
    title: string;
  };
}

interface ReportStudentItem {
  id: string;
  fullName: string | null;
  email: string;
  gradeLevel: number | null;
  totalStudySeconds: number;
  totalSessions: number;
  lastActive: string | null;
}

interface ProgressData {
  stats: any;
  weeklyProgress: any[];
  achievements: any[];
  recentActivity: any[];
}

// Helpers
function formatStudyTime(totalSeconds: number, compact = false) {
  if (totalSeconds < 60) return `${totalSeconds} giây`;
  if (totalSeconds < 3600) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} ${compact ? "phút" : "phút"}`;
  }
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours} ${compact ? "giờ" : "giờ"}`;
}

const NotionIcon = ({ icon: Icon, color, bgColor }: { icon: React.ElementType, color: string, bgColor: string }) => (
  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bgColor)}>
    <Icon className={cn("h-5 w-5", color)} />
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportResponse, progressResponse] = await Promise.all([
          fetch("/api/reports/study-time"),
          fetch("/api/progress"),
        ]);

        if (!reportResponse.ok) throw new Error("Failed to load study report");
        
        const reportData = await reportResponse.json();
        setReport(reportData);

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgress(progressData);
        } else {
          console.warn("Could not load progress data, dashboard will be limited.");
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setReport(null);
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const pageTitle = useMemo(() => {
    switch (user?.role) {
      case "ADMIN": return "Báo cáo quản trị học tập";
      case "PARENT": return "Báo cáo học tập của con";
      default: return "Tổng quan học tập";
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500">Đang tải không gian học tập của bạn...</span>
      </div>
    );
  }
  
  const StatCard = ({ icon, label, value, change, color, bgColor }: any) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
      <div className="flex items-center gap-4">
        <NotionIcon icon={icon} color={color} bgColor={bgColor}/>
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
      {change && <div className="mt-2 text-xs font-medium text-slate-500">{change}</div>}
    </div>
  );
  
  const QuickFacts = () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
       {progress?.stats && (
        <>
          <StatCard 
            icon={TrendingUp}
            label="Giờ học (tuần)"
            value={progress.stats.weeklyStudyHours || 0}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard 
            icon={Target}
            label="Điểm trung bình"
            value={progress.stats.averageScore || 0}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
          />
          <StatCard 
            icon={CheckCircle}
            label="Bài tập AI"
            value={progress.stats.completedExercises || 0}
            color="text-brand-600"
            bgColor="bg-brand-100"
          />
          <StatCard 
            icon={Award}
            label="Thành tích"
            value={`${progress.stats.achievementCount || 0}/${progress.stats.totalAchievements || 4}`}
            color="text-amber-500"
            bgColor="bg-amber-100"
          />
        </>
      )}
    </div>
  );

  const ActivityFeed = () => (
    <div className="space-y-3">
      <h3 className="px-2 text-lg font-bold text-slate-800">Hoạt động gần đây</h3>
            {progress && progress.recentActivity && progress.recentActivity.length > 0 ? (
        progress.recentActivity.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100/80">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", item.bgColor)}>
              <span className="text-sm">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{item.title}</p>
              <p className="text-xs text-slate-500">{item.time}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
          Chưa có hoạt động nào được ghi nhận.
        </div>
      )}
    </div>
  );

  const StudentDatabase = () => (
    <div className="space-y-4">
      <h3 className="px-2 text-lg font-bold text-slate-800">{user?.role === "ADMIN" ? "Quản lý học sinh" : "Theo dõi con"}</h3>
       <div className="space-y-3">
        {(user?.role === "ADMIN" ? report.students : report.children || []).map((student: ReportStudentItem) => (
          <div key={student.id} className="grid grid-cols-3 items-center gap-4 rounded-xl p-2 text-sm hover:bg-slate-100/80">
            <div className="font-medium text-slate-800">{student.fullName || student.email}</div>
            <div className="text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</div>
            <div className="text-right font-medium text-slate-700">{formatStudyTime(student.totalStudySeconds || 0, true)}</div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const WeeklyProgressChart = () => (
    <div className="space-y-3">
      <h3 className="px-2 text-lg font-bold text-slate-800">Mục tiêu tuần</h3>
      <div className="grid grid-cols-7 gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-4">
        {progress?.weeklyProgress.map((day, index) => (
          <div key={index} className="text-center">
            <div className="text-xs font-bold text-slate-500">{day.day}</div>
            <div className={cn("my-2 mx-auto h-10 w-10 rounded-lg", day.completed ? "bg-brand-200" : "bg-slate-100")}></div>
            <div className="text-[11px] font-medium text-slate-400">{day.hours}h</div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const Achievements = () => (
    <div className="space-y-3">
       <h3 className="px-2 text-lg font-bold text-slate-800">Thành tích đã đạt được</h3>
       <div className="grid grid-cols-2 gap-3">
        {progress?.achievements.map((ach: any) => (
          <div key={ach.id} className={cn("rounded-xl p-3", ach.unlocked ? "bg-amber-100/80 border-amber-200/90 border" : "bg-slate-100/80")}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{ach.icon}</span>
              <p className={cn("text-sm font-bold", ach.unlocked ? "text-amber-900" : "text-slate-600")}>{ach.title}</p>
            </div>
            <p className={cn("mt-1 text-xs", ach.unlocked ? "text-amber-700" : "text-slate-500")}>{ach.description}</p>
          </div>
        ))}
       </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NotionIcon icon={BookOpen} color="text-brand-600" bgColor="bg-brand-100" />
          <h1 className="mt-3 font-serif text-3xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-slate-500">Không gian học tập cá nhân của bạn.</p>
        </div>
        <Link href="/courses">
           <Button className="h-11 rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">
             <Play className="mr-2 h-4 w-4 fill-current" />
             Vào học
           </Button>
        </Link>
      </div>
      
      {/* Notion-style grid */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
           {user?.role === "STUDENT" && progress && <QuickFacts />}
           {(user?.role === "ADMIN" || user?.role === "PARENT") && report && <StudentDatabase />}
           {user?.role === "STUDENT" && progress && <ActivityFeed />}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
           {user?.role === "STUDENT" && progress && (
            <>
              <WeeklyProgressChart />
              <Achievements />
            </>
           )}
           <div className="rounded-2xl bg-slate-800 p-6 text-white">
              <h3 className="text-lg font-bold">Ghi chú nhanh</h3>
              <textarea 
                className="mt-3 w-full resize-none rounded-lg border-slate-600 bg-slate-700 p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Viết nhanh một ý tưởng..."
                rows={4}
              ></textarea>
           </div>
        </div>
      </div>
    </div>
  );
}

