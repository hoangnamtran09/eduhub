"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Trophy, TrendingUp, Target, Calendar, Award, ChevronRight, Flame, Gem, BookOpen } from "lucide-react";
import Link from "next/link";

interface WeeklyItem {
  day: string;
  hours: number;
  completed: boolean;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface ActivityItem {
  type: string;
  title: string;
  time: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface ProgressPayload {
  stats: {
    averageScore: number;
    completedExercises: number;
    weeklyStudyHours: number;
    achievementCount: number;
    totalAchievements: number;
    streakDays: number;
    diamonds: number;
  };
  weeklyProgress: WeeklyItem[];
  achievements: AchievementItem[];
  recentActivity: ActivityItem[];
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch("/api/progress");
        if (!response.ok) {
          throw new Error("Failed to load progress");
        }

        const payload = await response.json();
        setData(payload);
      } catch (error) {
        console.error("Failed to load progress page:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  const maxHours = useMemo(() => {
    if (!data?.weeklyProgress?.length) return 1;
    return Math.max(...data.weeklyProgress.map((item) => item.hours), 1);
  }, [data]);

  const hasAchievements = (data?.achievements?.length || 0) > 0;

  if (loading) {
    return <LoadingState message="Đang tải tiến độ học tập..." />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Trophy}
        title="Không tải được dữ liệu"
        description="Không tải được dữ liệu tiến độ học tập. Vui lòng thử lại sau."
        action={<Link href="/courses"><Button>Bắt đầu học</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        label="Tiến độ học tập"
        labelVariant="brand"
        title="Tiến độ học tập"
        description="Theo dõi dữ liệu học tập thật được ghi nhận từ hệ thống."
      />

      <div className={`grid grid-cols-2 gap-4 ${hasAchievements ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <StatCard icon={Trophy} value={String(data.stats.averageScore)} label="Điểm quiz TB" />
        <StatCard icon={Target} value={String(data.stats.completedExercises)} label="Bài tập đạt" />
        <StatCard icon={Calendar} value={`${data.stats.weeklyStudyHours}h`} label="Tuần này" />
        {hasAchievements && <StatCard icon={Award} value={`${data.stats.achievementCount}/${data.stats.totalAchievements}`} label="Thành tựu" />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard icon={Flame} value={String(data.stats.streakDays)} label="Chuỗi học" variant="amber" />
        <StatCard icon={Gem} value={String(data.stats.diamonds)} label="Kim cương" variant="violet" />
      </div>

      <Card className="border-white/80 bg-white/94 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            Hoạt động tuần này
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end justify-between gap-2">
            {data.weeklyProgress.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all ${day.hours > 0 ? "bg-brand-500" : "bg-paper-200"}`}
                    style={{ height: `${(day.hours / maxHours) * 100}%`, minHeight: day.hours > 0 ? "8px" : "4px" }}
                  />
                  {day.hours > 0 && <span className="mt-1 text-xs text-slate-500">{day.hours}h</span>}
                </div>
                <span className={`text-xs font-medium ${day.completed ? "text-slate-700" : "text-slate-400"}`}>{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasAchievements && (
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Award className="h-5 w-5 text-accent-500" />
          Thành tựu
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.achievements.map((achievement) => (
            <Card key={achievement.id} className={`border-white/80 bg-white/94 shadow-soft ${!achievement.unlocked ? "opacity-60" : ""}`}>
              <CardContent className="p-4 text-center">
                <div className={`mb-2 text-4xl ${!achievement.unlocked ? "grayscale" : ""}`}>{achievement.icon}</div>
                <h4 className="font-medium text-slate-900">{achievement.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
                {achievement.unlocked ? (
                  <span className="mt-2 inline-block rounded-full bg-success/10 px-2 py-1 text-xs text-success">
                    Đã đạt được
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    Tiếp tục <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      )}

      <Card className="border-white/80 bg-white/94 shadow-soft">
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.length ? (
            data.recentActivity.map((activity, index) => (
              <div key={`${activity.type}-${index}`} className="flex items-start gap-4 rounded-2xl border border-paper-200 bg-paper-50/60 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.bgColor} ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Chưa có hoạt động"
              description="Bắt đầu học để ghi nhận hoạt động đầu tiên."
              action={<Link href="/courses"><Button size="sm">Khám phá khóa học</Button></Link>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

