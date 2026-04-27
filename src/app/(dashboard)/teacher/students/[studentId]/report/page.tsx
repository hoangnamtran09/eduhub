"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, BrainCircuit, ClipboardList, Clock, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReportPayload = {
  student: {
    id: string;
    email: string;
    fullName: string | null;
    gradeLevel: number | null;
    profile?: { streakDays?: number; lastActive?: string | null } | null;
  };
  summary: {
    totalStudySeconds: number;
    totalSessions: number;
    weeklyStudySeconds: number;
    averageQuizScore: number;
    completedExercises: number;
    streakDays: number;
    lastActive: string | null;
    assignments: {
      total: number;
      pending: number;
      accepted: number;
      submitted: number;
      reviewed: number;
      returned: number;
      overdue: number;
      dueSoon: number;
    };
    progress: {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
    };
  };
  weeklyProgress: Array<{ day: string; hours: number; completed: boolean }>;
  recentActivity: Array<{ id: string; startedAt: string; durationSec: number; lesson?: { title?: string; subject?: { name?: string } } | null }>;
  lessonProgress: Array<{ id: string; status: string; progressPct: number; lesson?: { title?: string; subject?: { name?: string } } | null }>;
  assignments: Array<{ id: string; status: string; score?: number | null; assignment?: { title?: string; dueDate?: string | null; maxScore?: number; lesson?: { title?: string } | null } | null }>;
  insights?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: Array<{ topic?: string; title?: string; recommendation?: string; severity?: string }>;
    mistakes?: Array<{ topic?: string; title?: string; reason?: string }>;
    roadmap?: Array<{ title?: string; description?: string }>;
  };
};

function formatHours(seconds = 0) {
  return `${(seconds / 3600).toFixed(1)} giờ`;
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

const statusLabels: Record<string, string> = {
  ASSIGNED: "Chưa nhận",
  ACCEPTED: "Đã nhận",
  SUBMITTED: "Đã nộp",
  REVIEWED: "Đã chấm",
  RETURNED: "Trả sửa",
};

export default function TeacherStudentReportPage() {
  const params = useParams<{ studentId: string }>();
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/teacher/students/${params.studentId}/report`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải báo cáo học tập");
        setReport(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Không thể tải báo cáo học tập");
      } finally {
        setLoading(false);
      }
    };

    if (params.studentId) loadReport();
  }, [params.studentId]);

  const maxWeeklyHours = useMemo(() => Math.max(1, ...(report?.weeklyProgress || []).map((item) => item.hours)), [report]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (error || !report) {
    return <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error || "Không tìm thấy báo cáo."}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <Link href="/teacher/students" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách học sinh
          </Link>
          <div className="mt-4 rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Báo cáo học tập</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{report.student.fullName || report.student.email}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {report.student.email} · {report.student.gradeLevel ? `Lớp ${report.student.gradeLevel}` : "Chưa phân lớp"} · Hoạt động cuối: {formatDate(report.summary.lastActive)}
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Clock} label="Tổng thời gian học" value={formatHours(report.summary.totalStudySeconds)} sub={`${report.summary.totalSessions} buổi học`} />
          <StatCard icon={TrendingUp} label="Tuần này" value={formatHours(report.summary.weeklyStudySeconds)} sub={`Chuỗi ${report.summary.streakDays} ngày`} />
          <StatCard icon={BookOpen} label="Điểm quiz TB" value={`${report.summary.averageQuizScore}`} sub={`${report.summary.completedExercises} bài luyện đạt`} />
          <StatCard icon={ClipboardList} label="Bài tập chờ" value={`${report.summary.assignments.pending + report.summary.assignments.accepted}`} sub={`${report.summary.assignments.overdue} quá hạn`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Hoạt động 7 ngày gần đây</CardTitle></CardHeader>
            <CardContent className="flex h-64 items-end gap-3">
              {report.weeklyProgress.map((item) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end rounded-xl bg-slate-100 p-1">
                    <div className="w-full rounded-lg bg-gradient-to-t from-brand-500 to-accent-400" style={{ height: `${Math.max(6, (item.hours / maxWeeklyHours) * 100)}%` }} />
                  </div>
                  <div className="text-xs font-semibold text-slate-500">{item.day}</div>
                  <div className="text-xs text-slate-400">{item.hours}h</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tổng quan bài học</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Đã hoàn thành" value={report.summary.progress.completed} />
              <Row label="Đang học" value={report.summary.progress.inProgress} />
              <Row label="Chưa bắt đầu" value={report.summary.progress.notStarted} />
              <Row label="Tổng bài có dữ liệu" value={report.summary.progress.total} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Bài tập đã giao</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.assignments.length === 0 ? <p className="text-sm text-slate-500">Chưa có bài tập nào.</p> : report.assignments.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.assignment?.title || "Bài tập"}</p>
                      <p className="mt-1 text-xs text-slate-500">Hạn nộp: {formatDate(item.assignment?.dueDate)}</p>
                    </div>
                    <Badge variant="outline">{statusLabels[item.status] || item.status}</Badge>
                  </div>
                  {item.score != null && <p className="mt-2 text-sm text-emerald-700">Điểm: {item.score}/{item.assignment?.maxScore || 10}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.recentActivity.length === 0 ? <p className="text-sm text-slate-500">Chưa có hoạt động học.</p> : report.recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{item.lesson?.title || "Bài học"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.lesson?.subject?.name || "Môn học"} · {formatHours(item.durationSec)} · {formatDate(item.startedAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-brand-600" />Phân tích học tập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.insights?.summary && <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">{report.insights.summary}</p>}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Điểm mạnh</h3>
                <div className="flex flex-wrap gap-2">
                  {(report.insights?.strengths || []).length === 0 ? <span className="text-sm text-slate-500">Chưa có dữ liệu.</span> : report.insights?.strengths?.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Chủ đề cần củng cố</h3>
                <div className="space-y-3">
                  {(report.insights?.weaknesses || []).length === 0 ? <span className="text-sm text-slate-500">Chưa có dữ liệu.</span> : report.insights?.weaknesses?.slice(0, 5).map((item, index) => (
                    <div key={`${item.topic || item.title}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm">
                      <p className="font-semibold text-amber-900">{item.topic || item.title || "Chủ đề"}</p>
                      {item.recommendation && <p className="mt-1 text-amber-800">{item.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
