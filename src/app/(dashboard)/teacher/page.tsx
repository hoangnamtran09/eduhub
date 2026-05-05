"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Eye,
  CalendarClock,
  FileText,
} from "lucide-react";

interface DashboardData {
  teacher: { fullName: string | null; email: string };
  stats: {
    totalStudents: number;
    activeThisWeek: number;
    pendingReviews: number;
    overdueAssignments: number;
  };
  recentSubmissions: Array<{
    id: string;
    assignmentTitle: string;
    assignmentId: string;
    studentName: string;
    studentId: string;
    submittedAt: string | null;
  }>;
  weeklyActivity: Array<{ day: string; hours: number; completed: boolean }>;
  topStudents: Array<{
    id: string;
    fullName: string | null;
    email: string;
    gradeLevel: number | null;
    totalStudySeconds: number;
    lastActive: string | null;
  }>;
  attentionStudents: Array<{
    id: string;
    fullName: string | null;
    email: string;
    gradeLevel: number | null;
    totalStudySeconds: number;
    inactiveDays: number | null;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    studentCount: number;
  }>;
}

function formatStudyTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)}p`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return m > 0 ? `${h}h${m}p` : `${h}h`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Chưa có hạn";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/teacher/dashboard");
        if (!res.ok) throw new Error("Không thể tải dữ liệu bảng điều hành.");
        setData(await res.json());
      } catch (err: any) {
        setError(err.message || "Lỗi không xác định.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Đang tải bảng điều hành..." />;
  }

  if (error || !data) {
    return (
      <div className="animate-fade-in space-y-6 pb-10 font-sans">
        <EmptyState
          icon={AlertTriangle}
          title="Không thể tải dữ liệu"
          description={error || "Vui lòng thử lại sau."}
        />
      </div>
    );
  }

  const { teacher, stats, recentSubmissions, weeklyActivity, upcomingDeadlines, topStudents, attentionStudents } = data;

  return (
    <div className="animate-fade-in space-y-6 pb-10 font-sans">
      <PageHeader
        label="Giáo viên"
        labelVariant="brand"
        title="Bảng điều hành"
        description={`Chào mừng ${teacher.fullName || teacher.email}. Theo dõi tổng quan lớp học của bạn.`}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Tổng học sinh" value={stats.totalStudents} variant="brand" />
        <StatCard icon={Activity} label="Hoạt động tuần này" value={stats.activeThisWeek} variant="emerald" />
        <StatCard icon={ClipboardCheck} label="Cần chấm bài" value={stats.pendingReviews} variant="violet" />
        <StatCard icon={AlertTriangle} label="Quá hạn" value={stats.overdueAssignments} variant={stats.overdueAssignments > 0 ? "rose" : "violet"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động tuần này</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-2">
            {weeklyActivity.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-ink-600">
                  {day.hours > 0 ? `${day.hours}h` : ""}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: day.completed ? `${Math.max((day.hours / 2) * 100, 8)}%` : "2px",
                    background: day.completed
                      ? "linear-gradient(180deg, #0EA5E9 0%, #38BDF8 100%)"
                      : "#E2E8F0",
                  }}
                />
                <span className="text-xs text-ink-400">{day.day}</span>
              </div>
            ))}
          </div>
          {weeklyActivity.every((d) => !d.completed) && (
            <p className="mt-4 text-center text-sm text-ink-400">
              Chưa có hoạt động học nào trong tuần này
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bài nộp gần đây</CardTitle>
              <p className="mt-1 text-sm text-ink-500">Học sinh vừa nộp bài, chờ giáo viên chấm điểm.</p>
            </div>
            <Link href="/teacher/assignments">
              <Button variant="ghost" size="sm" className="gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <EmptyState icon={FileText} title="Chưa có bài nộp" description="Học sinh chưa nộp bài tập nào." />
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/teacher/assignments/${sub.assignmentId}`}
                    className="flex items-center justify-between rounded-xl border border-ink-100 bg-paper-50 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">{sub.assignmentTitle}</p>
                      <p className="truncate text-sm text-ink-500">{sub.studentName}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {sub.submittedAt ? formatDate(sub.submittedAt) : "Không rõ"}
                      </p>
                    </div>
                    <StatusBadge variant="submitted" label="Đã nộp" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sắp đến hạn</CardTitle>
              <p className="mt-1 text-sm text-ink-500">Bài tập cần nộp trong 7 ngày tới.</p>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Không có bài sắp hạn" description="Không có bài tập nào cần nộp trong tuần này." />
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item) => (
                  <Link
                    key={item.id}
                    href={`/teacher/assignments/${item.id}`}
                    className="flex items-center justify-between rounded-xl border border-ink-100 bg-paper-50 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">{item.title}</p>
                      <p className="text-sm text-ink-500">{item.studentCount} học sinh</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      Hạn: {formatDate(item.dueDate)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Học sinh tích cực nhất</CardTitle>
              <p className="mt-1 text-sm text-ink-500">Top học sinh theo thời lượng học tập.</p>
            </div>
            <Link href="/teacher/students">
              <Button variant="ghost" size="sm" className="gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <EmptyState icon={BookOpen} title="Chưa có dữ liệu" description="Chưa có học sinh nào có hoạt động học tập." />
            ) : (
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 bg-paper-50 p-4"
                  >
                    <span className="w-6 text-sm font-semibold text-ink-300">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">{student.fullName || student.email}</p>
                      <p className="truncate text-sm text-ink-500">
                        {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"} —{" "}
                        {student.lastActive
                          ? new Date(student.lastActive).toLocaleDateString("vi-VN")
                          : "Chưa có hoạt động"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">{formatStudyTime(student.totalStudySeconds)}</p>
                      <Link
                        href={`/teacher/students/${student.id}/report`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        Báo cáo
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cần chú ý</CardTitle>
              <p className="mt-1 text-sm text-ink-500">Học sinh chưa hoạt động hoặc không học trong 7+ ngày.</p>
            </div>
          </CardHeader>
          <CardContent>
            {attentionStudents.length === 0 ? (
              <EmptyState icon={Users} title="Tất cả đều ổn" description="Không có học sinh nào cần chú ý ở thời điểm hiện tại." />
            ) : (
              <div className="space-y-3">
                {attentionStudents.map((student) => (
                  <div key={student.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{student.fullName || student.email}</p>
                        <p className="text-sm text-ink-500">
                          {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {student.totalStudySeconds === 0 && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">Chưa học</span>
                        )}
                        {student.inactiveDays !== null && student.inactiveDays > 7 && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Inactive {student.inactiveDays} ngày</span>
                        )}
                        {student.inactiveDays === null && student.totalStudySeconds > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Chưa có lastActive</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/teacher/students/${student.id}/report`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem báo cáo
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
