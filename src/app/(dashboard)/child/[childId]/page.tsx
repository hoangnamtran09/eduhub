"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  Route,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

interface ChildData {
  child: {
    id: string;
    email: string;
    fullName: string | null;
    gradeLevel: number | null;
  };
  stats: {
    averageScore: number;
    completedExercises: number;
    weeklyStudyHours: number;
    totalStudySeconds: number;
    achievementCount: number;
    totalAchievements: number;
    streakDays: number;
    diamonds: number;
    pendingAssignments: number;
    overdueAssignments: number;
    topWeakness: string | null;
  };
  weeklyProgress: Array<{ day: string; hours: number; completed: boolean }>;
  achievements: Array<{ id: string; title: string; description: string; icon: string; unlocked: boolean }>;
  assignments: Array<{ id: string; title: string; dueDate: string | null; status: string; isOverdue: boolean }>;
  recentActivity: Array<{ type: string; title: string; timestamp: string; icon: string; time: string }>;
  weaknesses: Array<{
    id: string;
    topic: string;
    severity: string;
    score: number;
    reason: string;
    recommendedAction: string;
    evidenceCount: number;
    lessonTitle?: string | null;
  }>;
  roadmap: Array<{
    id: string;
    title: string;
    description: string;
    focusTopic: string;
    actionType: string;
    priority: number;
    estimatedMinutes: number;
  }>;
}

function formatStudyTime(totalSeconds: number, short?: boolean): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (short) {
    if (hours === 0) return `${minutes}p`;
    return `${hours}h${minutes}p`;
  }
  if (hours === 0) return `${minutes} phút`;
  return `${hours} giờ ${minutes} phút`;
}

function getSeverityBadge(severity: string) {
  if (severity === "high") return { variant: "high" as const, label: "Cao" };
  if (severity === "medium") return { variant: "medium" as const, label: "Trung bình" };
  return { variant: "low" as const, label: "Thấp" };
}

function getActionBadge(actionType: string) {
  switch (actionType) {
    case "review": return { bg: "border-sky-200 bg-sky-50 text-sky-700", label: "Ôn tập" };
    case "practice": return { bg: "border-violet-200 bg-violet-50 text-violet-700", label: "Luyện tập" };
    case "quiz": return { bg: "border-amber-200 bg-amber-50 text-amber-700", label: "Quiz" };
    case "study": return { bg: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Học" };
    default: return { bg: "border-slate-200 bg-slate-50 text-slate-600", label: actionType };
  }
}

function getAssignmentStatusBadge(status: string) {
  const map: Record<string, { variant: "submitted" | "reviewed" | "returned" | "overdue" | "assigned" | "pending"; label: string }> = {
    ASSIGNED: { variant: "assigned", label: "Được giao" },
    ACCEPTED: { variant: "pending", label: "Đã nhận" },
    SUBMITTED: { variant: "submitted", label: "Đã nộp" },
    REVIEWED: { variant: "reviewed", label: "Đã chấm" },
    RETURNED: { variant: "returned", label: "Cần sửa" },
  };
  return map[status] || { variant: "pending" as const, label: status };
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/parent/child/${childId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Không tìm thấy học sinh này.");
          if (res.status === 403) throw new Error("Bạn không có quyền xem trang này.");
          throw new Error("Không thể tải dữ liệu.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi.");
      } finally {
        setLoading(false);
      }
    }
    if (childId) load();
  }, [childId]);

  if (loading) {
    return <LoadingState message="Đang tải thông tin học sinh..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Quay lại
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title={error || "Không có dữ liệu"}
          description="Vui lòng thử lại sau."
          action={
            <Button onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  const { child, stats, weeklyProgress, achievements, assignments, recentActivity, weaknesses, roadmap } = data;
  const maxWeeklyHours = Math.max(...weeklyProgress.map((d) => d.hours), 1);

  return (
    <div className="animate-fade-in space-y-6 pb-10 font-sans">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.push("/")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
        Quay lại tổng quan
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <PageHeader
              title={child.fullName || child.email}
              description={
                child.gradeLevel
                  ? `Lớp ${child.gradeLevel} — Theo dõi tiến độ và kết quả học tập`
                  : "Theo dõi tiến độ và kết quả học tập"
              }
            />
          </div>
          <div className="flex gap-2">
            <a
              href={`mailto:${child.email}?subject=${encodeURIComponent("Nhắc học hôm nay")}&body=${encodeURIComponent("Con vào EduHub hoàn thành bài tập và học một phiên ngắn hôm nay nhé.")}`}
            >
              <Button variant="outline" leftIcon={<Mail className="h-4 w-4" />}>
                Nhắn con
              </Button>
            </a>
            <Link href={`/assignments`}>
              <Button leftIcon={<BookOpen className="h-4 w-4" />}>
                Xem bài tập
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Giờ học (tuần)"
          value={stats.weeklyStudyHours}
          sublabel={`Tổng: ${formatStudyTime(stats.totalStudySeconds, true)}`}
          variant="brand"
        />
        <StatCard
          icon={Target}
          label="Điểm trung bình"
          value={stats.averageScore}
          sublabel={`${stats.completedExercises} bài tập AI`}
          variant="emerald"
        />
        <StatCard
          icon={Award}
          label="Chuỗi học"
          value={stats.streakDays}
          sublabel={`${stats.diamonds} diamonds`}
          variant="amber"
        />
        <StatCard
          icon={BookOpen}
          label="Bài tập chờ"
          value={stats.pendingAssignments}
          sublabel={`${stats.overdueAssignments} quá hạn`}
          variant={stats.overdueAssignments > 0 ? "rose" : "violet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tiến độ tuần này</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-ink-600">
                    {day.hours > 0 ? `${day.hours}h` : ""}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${(day.hours / maxWeeklyHours) * 100}%`,
                      minHeight: day.completed ? "4px" : "1px",
                      background: day.completed
                        ? "linear-gradient(180deg, #0EA5E9 0%, #38BDF8 100%)"
                        : "#E2E8F0",
                    }}
                  />
                  <span className="text-xs text-ink-400">{day.day}</span>
                </div>
              ))}
            </div>
            {weeklyProgress.every((d) => !d.completed) && (
              <p className="mt-4 text-center text-sm text-ink-400">
                Chưa có hoạt động học nào trong tuần này
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Thành tựu</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <EmptyState icon={Award} title="Chưa có thành tựu" description="Học sinh cần hoàn thành các mốc học tập." />
            ) : (
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      achievement.unlocked
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <span className="text-xl">{achievement.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{achievement.title}</p>
                      <p className="text-xs text-ink-500">{achievement.unlocked ? "Đã đạt được" : "Chưa mở khóa"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weakness & Roadmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Chủ đề cần cải thiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaknesses.length === 0 ? (
              <EmptyState icon={Award} title="Không có điểm yếu" description="Học sinh đang học tập tốt!" />
            ) : (
              <div className="space-y-3">
                {weaknesses.map((weakness) => {
                  const severity = getSeverityBadge(weakness.severity);
                  return (
                    <div key={weakness.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{weakness.topic}</p>
                          {weakness.lessonTitle && (
                            <p className="text-xs text-ink-500 mt-0.5">{weakness.lessonTitle}</p>
                          )}
                        </div>
                        <StatusBadge variant={severity.variant} label={severity.label} />
                      </div>
                      <p className="mt-2 text-sm text-ink-600">{weakness.reason}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-ink-400">{weakness.evidenceCount} bằng chứng</span>
                        <span className="text-xs font-medium text-violet-600">{weakness.recommendedAction}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-brand-500" />
              Lộ trình đề xuất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roadmap.length === 0 ? (
              <EmptyState icon={Route} title="Chưa có lộ trình" description="Hoàn thành thêm bài học để nhận đề xuất." />
            ) : (
              <div className="space-y-3">
                {roadmap.map((step, index) => {
                  const action = getActionBadge(step.actionType);
                  return (
                    <div key={step.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">{step.title}</p>
                        <p className="text-sm text-ink-600 mt-0.5 line-clamp-2">{step.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${action.bg}`}>
                            {action.label}
                          </span>
                          <span className="text-xs text-ink-400">{step.estimatedMinutes} phút</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-500" />
            Bài tập ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <EmptyState icon={BookOpen} title="Không có bài tập" description="Chưa có bài tập nào đang chờ xử lý." />
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((assignment) => {
                const statusInfo = getAssignmentStatusBadge(assignment.status);
                return (
                  <div key={assignment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900 truncate">{assignment.title}</p>
                      {assignment.dueDate && (
                        <p className="text-xs text-ink-500 mt-0.5">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Hạn: {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                    <StatusBadge variant={assignment.isOverdue ? "overdue" : statusInfo.variant} label={assignment.isOverdue ? "Quá hạn" : statusInfo.label} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Clock} title="Chưa có hoạt động" description="Học sinh chưa có hoạt động học tập nào gần đây." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-lg">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{item.title}</p>
                    <p className="text-xs text-ink-400">{item.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-300" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
