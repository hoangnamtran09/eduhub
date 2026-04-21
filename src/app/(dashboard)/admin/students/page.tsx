"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Filter,
  Loader2,
  Mail,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentProfile {
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  streakDays: number;
  lastActive: string | null;
}

interface StudentEnrollment {
  course: {
    id: string;
    title: string;
  } | null;
}

interface StudentProgress {
  completed: boolean;
}

interface StudentRecord {
  id: string;
  email: string;
  fullName: string | null;
  gradeLevel: number | null;
  diamonds: number;
  createdAt: string;
  profile: StudentProfile | null;
  enrollments: StudentEnrollment[];
  progress: StudentProgress[];
}

const gradeOptions = ["Tất cả", "Chưa phân lớp", "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5", "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Tất cả");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch("/api/admin/students");
        if (!response.ok) {
          throw new Error("Failed to load students");
        }

        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return students.filter((student) => {
      const matchesQuery =
        !normalized ||
        student.fullName?.toLowerCase().includes(normalized) ||
        student.email.toLowerCase().includes(normalized);

      const matchesGrade =
        selectedGrade === "Tất cả" ||
        (selectedGrade === "Chưa phân lớp" && !student.gradeLevel) ||
        selectedGrade === `Lớp ${student.gradeLevel}`;

      return matchesQuery && matchesGrade;
    });
  }, [query, selectedGrade, students]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((student) => (student.profile?.streakDays || 0) > 0).length;
    const totalEnrollments = students.reduce((sum, student) => sum + student.enrollments.length, 0);
    const completedLessons = students.reduce(
      (sum, student) => sum + student.progress.filter((item) => item.completed).length,
      0
    );

    return { totalStudents, activeStudents, totalEnrollments, completedLessons };
  }, [students]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Đang tải danh sách học sinh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#f8fafc_42%,_#eef2ff_100%)] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Student Control Room
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Quản lý học sinh
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Theo dõi danh sách học sinh, mức độ hoạt động, khóa học đã tham gia và tiến độ học tập trong một màn hình duy nhất.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <InsightCard label="Tổng học sinh" value={stats.totalStudents} icon={Users} accent="from-sky-500 to-cyan-400" />
              <InsightCard label="Đang hoạt động" value={stats.activeStudents} icon={Sparkles} accent="from-emerald-500 to-teal-400" />
              <InsightCard label="Lượt ghi danh" value={stats.totalEnrollments} icon={BookOpen} accent="from-fuchsia-500 to-pink-400" />
              <InsightCard label="Bài đã xong" value={stats.completedLessons} icon={Filter} accent="from-amber-500 to-orange-400" />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email học sinh"
                className="h-12 rounded-2xl border-slate-200 pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((grade) => (
                <Button
                  key={grade}
                  variant={selectedGrade === grade ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedGrade(grade)}
                  className={cn(
                    "rounded-full px-4",
                    selectedGrade === grade && "shadow-sm"
                  )}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {filteredStudents.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-700">Chưa tìm thấy học sinh phù hợp</h2>
            <p className="mt-2 text-sm text-slate-500">Hãy thử đổi bộ lọc hoặc nhập từ khóa khác.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredStudents.map((student) => {
              const completedLessons = student.progress.filter((item) => item.completed).length;
              const streakDays = student.profile?.streakDays || 0;
              const lastActive = student.profile?.lastActive
                ? new Date(student.profile.lastActive).toLocaleDateString("vi-VN")
                : "Chưa cập nhật";

              return (
                <Card
                  key={student.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                >
                  <div className="bg-[linear-gradient(135deg,_rgba(14,165,233,0.12),_rgba(251,191,36,0.18),_rgba(244,114,182,0.12))] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                          {(student.fullName || student.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            {student.fullName || "Chưa cập nhật tên"}
                          </h2>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-5 p-6">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <MetricChip label="Kim cương" value={student.diamonds} tone="amber" />
                      <MetricChip label="Chuỗi học" value={streakDays} tone="emerald" />
                      <MetricChip label="Khóa học" value={student.enrollments.length} tone="sky" />
                      <MetricChip label="Hoàn thành" value={completedLessons} tone="rose" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Mục tiêu & năng lực</p>
                        <div className="mt-3 space-y-3 text-sm">
                          <TagGroup title="Mục tiêu" items={student.profile?.goals} emptyLabel="Chưa có mục tiêu" />
                          <TagGroup title="Điểm mạnh" items={student.profile?.strengths} emptyLabel="Chưa đánh giá" />
                          <TagGroup title="Cần cải thiện" items={student.profile?.weaknesses} emptyLabel="Chưa ghi nhận" tone="rose" />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hoạt động gần đây</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <InfoRow label="Ngày tham gia" value={new Date(student.createdAt).toLocaleDateString("vi-VN")} />
                          <InfoRow label="Hoạt động cuối" value={lastActive} />
                          <InfoRow
                            label="Khóa đang học"
                            value={
                              student.enrollments.length
                                ? student.enrollments
                                    .slice(0, 2)
                                    .map((enrollment) => enrollment.course?.title || "Khóa học")
                                    .join(", ")
                                : "Chưa ghi danh"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MetricChip({ label, value, tone }: { label: string; value: number; tone: "amber" | "emerald" | "sky" | "rose" }) {
  const toneStyles = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className={cn("rounded-2xl px-4 py-3", toneStyles[tone])}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function TagGroup({
  title,
  items,
  emptyLabel,
  tone = "slate",
}: {
  title: string;
  items?: string[];
  emptyLabel: string;
  tone?: "slate" | "rose";
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                tone === "rose" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-600"
              )}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}