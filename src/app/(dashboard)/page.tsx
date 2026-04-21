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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

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

function formatStudyTime(totalSeconds: number) {
  if (totalSeconds >= 3600) {
    return `${(totalSeconds / 3600).toFixed(1)} giờ`;
  }

  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  return `${minutes} phút`;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetch("/api/reports/study-time");
        if (!response.ok) {
          throw new Error("Failed to load study report");
        }

        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Failed to load dashboard report:", error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const summaryCards = useMemo(() => {
    if (!report) return [];

    if (report.role === "ADMIN") {
      const students = report.students || [];
      const totalStudySeconds = students.reduce((sum: number, student: ReportStudentItem) => sum + student.totalStudySeconds, 0);
      return [
        { label: "Học sinh", value: String(students.length), suffix: "đang được theo dõi", icon: Users, color: "text-violet-600", bgColor: "bg-violet-50" },
        { label: "Thời gian học", value: formatStudyTime(totalStudySeconds), suffix: "tổng ghi nhận", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
      ];
    }

    if (report.role === "PARENT") {
      const children = report.children || [];
      const totalStudySeconds = children.reduce((sum: number, child: ReportStudentItem) => sum + child.totalStudySeconds, 0);
      return [
        { label: "Con đang theo dõi", value: String(children.length), suffix: "hồ sơ học tập", icon: Users, color: "text-emerald-600", bgColor: "bg-emerald-50" },
        { label: "Thời gian học", value: formatStudyTime(totalStudySeconds), suffix: "tổng đã học", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
      ];
    }

    return [
      { label: "Thời gian học", value: formatStudyTime(report.totalStudySeconds || 0), suffix: "đã ghi nhận", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
      { label: "Phiên học", value: String(report.totalSessions || 0), suffix: "đã bắt đầu", icon: BarChart3, color: "text-amber-500", bgColor: "bg-amber-50" },
    ];
  }, [report]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            Academic Command Center
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
            {user?.role === "ADMIN" ? "Báo cáo quản trị học tập" : user?.role === "PARENT" ? "Báo cáo học tập của con" : "Tổng quan học tập"}
          </h1>
          <p className="text-lg text-slate-500">
            Dữ liệu thời gian học được ghi nhận tự động khi bắt đầu vào bài học.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="h-12 rounded-2xl bg-ink-900 px-8 font-bold text-white hover:bg-ink-800">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Bắt đầu học
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden rounded-[32px] border border-white/80 bg-white/94 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-tight text-slate-500">{stat.suffix}</p>
                  </div>
                  <div className={cn("rounded-2xl p-4 shadow-sm", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {report?.role === "STUDENT" && (
        <div className="grid gap-4">
          {(report.sessions || []).slice(0, 6).map((session: StudySessionItem) => (
            <div key={session.id} className="flex items-center gap-4 rounded-[28px] border border-slate-200/60 bg-white p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{session.lesson?.title || "Buổi học"}</p>
                <p className="text-sm text-slate-500">{new Date(session.startedAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="text-sm font-semibold text-slate-900">{formatStudyTime(session.durationSec || 0)}</div>
            </div>
          ))}
        </div>
      )}

      {(report?.role === "ADMIN" || report?.role === "PARENT") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {report.role === "ADMIN" ? "Học sinh học gần đây" : "Con đang được theo dõi"}
            </h2>
            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-brand-600 hover:bg-brand-50">
              Xem thêm <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            {(report.role === "ADMIN" ? report.students : report.children || []).map((student: ReportStudentItem) => (
              <div key={student.id} className="flex items-center gap-5 rounded-[28px] border border-slate-200/60 bg-white p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{student.fullName || student.email}</p>
                  <p className="text-sm text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatStudyTime(student.totalStudySeconds || 0)}</p>
                  <p className="text-xs text-slate-500">{student.totalSessions} phiên học</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#111827_0%,#1f2a3d_52%,#153f3d_100%)] p-8 shadow-2xl shadow-slate-300">
        <div className="relative z-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="h-6 w-6 text-brand-400" />
          </div>
          <h3 className="mb-2 text-2xl font-bold leading-tight text-white">Dữ liệu học tập đang được ghi nhận</h3>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            Khi học sinh bấm vào bài học, hệ thống sẽ bắt đầu đếm thời gian học và dùng dữ liệu đó cho báo cáo phụ huynh và quản trị.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
    </div>
  );
}
