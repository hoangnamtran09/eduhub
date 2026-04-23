"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Layers3,
  Loader2,
  Play,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface ReportStudentItem {
  id: string;
  fullName: string | null;
  email: string;
  gradeLevel: number | null;
  totalStudySeconds: number;
  totalSessions: number;
  lastActive: string | null;
  streakDays?: number;
  enrollmentCount?: number;
  isActive7d?: boolean;
  inactiveDays?: number | null;
}

interface AdminSummary {
  totalStudents: number;
  totalStudySeconds: number;
  totalSessions: number;
  activeStudents7d: number;
  inactiveStudents7d: number;
  unassignedGradeCount: number;
}

interface AdminReportData {
  role: "ADMIN";
  summary: AdminSummary;
  students: ReportStudentItem[];
  topStudents: ReportStudentItem[];
  attentionStudents: ReportStudentItem[];
  gradeDistribution: Array<{
    gradeLevel: number | null;
    count: number;
  }>;
}

interface ParentReportData {
  role: "PARENT";
  children: ReportStudentItem[];
}

interface StudentSessionItem {
  id: string;
  durationSec: number;
  startedAt: string;
  lesson?: {
    id: string;
    title: string;
  };
}

interface StudentReportData {
  role: "STUDENT" | "TEACHER";
  totalStudySeconds: number;
  totalSessions: number;
  sessions: StudentSessionItem[];
}

type ReportData = AdminReportData | ParentReportData | StudentReportData | null;

interface ProgressData {
  stats: {
    weeklyStudyHours: number;
    averageScore: number;
    completedExercises: number;
    achievementCount: number;
    totalAchievements: number;
    streakDays: number;
    diamonds: number;
  };
  weeklyProgress: Array<{
    day: string;
    hours: number;
    completed: boolean;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    timestamp: string;
    icon: string;
    color: string;
    bgColor: string;
    time: string;
  }>;
}

function formatStudyTime(totalSeconds: number, compact = false) {
  if (totalSeconds < 60) return `${totalSeconds} giây`;
  if (totalSeconds < 3600) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} phút`;
  }
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours} ${compact ? "giờ" : "giờ"}`;
}

function formatLastActive(lastActive: string | null | undefined) {
  if (!lastActive) return "Chưa có hoạt động";
  return new Date(lastActive).toLocaleDateString("vi-VN");
}

function BlockIcon({ icon: Icon, color, bgColor }: { icon: React.ElementType; color: string; bgColor: string }) {
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bgColor)}>
      <Icon className={cn("h-5 w-5", color)} />
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/88 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <BlockIcon icon={icon} color={color} bgColor={bgColor} />
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ report }: { report: AdminReportData }) {
  const mostPopulatedGrade = useMemo(() => {
    if (!report.gradeDistribution.length) return null;
    return [...report.gradeDistribution].sort((a, b) => b.count - a.count)[0];
  }, [report.gradeDistribution]);

  return (
    <div className="animate-fade-in space-y-8 pb-10 font-sans">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Admin Workspace
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Trung tâm điều hành học tập</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Góc nhìn tổng quan cho quản trị viên: theo dõi mức độ hoạt động của học sinh, phát hiện nhóm cần can thiệp sớm và truy cập nhanh các khu vực vận hành chính.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/students">
              <Button className="h-11 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                <Users className="mr-2 h-4 w-4" />
                Quản lý học sinh
              </Button>
            </Link>
            <Link href="/admin/assignments">
              <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                <BookOpen className="mr-2 h-4 w-4" />
                Giao bài tập
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#162033_100%)] p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Snapshot hệ thống</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/65">Khối lớp đông nhất</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {mostPopulatedGrade ? (mostPopulatedGrade.gradeLevel ? `Lớp ${mostPopulatedGrade.gradeLevel}` : "Chưa phân lớp") : "Chưa có dữ liệu"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {mostPopulatedGrade ? `${mostPopulatedGrade.count} học sinh` : "Hệ thống chưa có phân bố khối lớp"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Đang hoạt động</p>
                <p className="mt-1 text-xl font-semibold">{report.summary.activeStudents7d}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Cần theo dõi</p>
                <p className="mt-1 text-xl font-semibold">{report.attentionStudents.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng học sinh"
          value={report.summary.totalStudents}
          detail={`${report.summary.unassignedGradeCount} học sinh chưa phân lớp`}
          color="text-sky-600"
          bgColor="bg-sky-100"
        />
        <StatCard
          icon={Clock}
          label="Tổng thời lượng học"
          value={formatStudyTime(report.summary.totalStudySeconds, true)}
          detail={`${report.summary.totalSessions} phiên học đã ghi nhận`}
          color="text-violet-600"
          bgColor="bg-violet-100"
        />
        <StatCard
          icon={Activity}
          label="Hoạt động 7 ngày"
          value={report.summary.activeStudents7d}
          detail={`${report.summary.inactiveStudents7d} học sinh chưa active`}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <StatCard
          icon={Layers3}
          label="Danh sách cần chú ý"
          value={report.attentionStudents.length}
          detail="Ưu tiên học sinh chưa học hoặc inactive lâu"
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle
                title="Top học sinh theo thời lượng học"
                description="Danh sách xếp hạng giúp theo dõi nhóm học sinh học đều và có mức tham gia cao nhất."
              />
              <Link href="/admin/students" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3">
              {report.topStudents.map((student, index) => (
                <div key={student.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 lg:grid-cols-[36px,minmax(0,1fr),120px,120px,140px] lg:items-center">
                  <div className="text-sm font-semibold text-slate-500">#{index + 1}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{student.fullName || student.email}</p>
                    <p className="truncate text-sm text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Thời lượng học</p>
                    <p className="text-sm font-semibold text-slate-900">{formatStudyTime(student.totalStudySeconds, true)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phiên học</p>
                    <p className="text-sm font-semibold text-slate-900">{student.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Hoạt động gần nhất</p>
                    <p className="text-sm font-semibold text-slate-900">{formatLastActive(student.lastActive)}</p>
                  </div>
                </div>
              ))}
              {!report.topStudents.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Chưa có dữ liệu để xếp hạng học sinh.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle
                title="Danh sách cần chú ý"
                description="Tập trung vào học sinh chưa có phiên học, chưa phân lớp hoặc đã lâu không hoạt động."
              />
              <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {report.attentionStudents.length} hồ sơ
              </div>
            </div>
            <div className="space-y-3">
              {report.attentionStudents.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{student.fullName || student.email}</p>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                          {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{student.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {student.totalSessions === 0 && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">Chưa có phiên học</span>
                      )}
                      {!student.gradeLevel && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">Chưa phân lớp</span>
                      )}
                      {student.inactiveDays == null ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">Chưa có hoạt động</span>
                      ) : student.inactiveDays > 7 ? (
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-700">Inactive {student.inactiveDays} ngày</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!report.attentionStudents.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Không có học sinh nào cần chú ý ở thời điểm hiện tại.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <SectionTitle
              title="Phân bố khối lớp"
              description="Nhanh chóng nhìn ra khối lớp đông học sinh và nhóm chưa được phân lớp."
            />
            <div className="mt-5 space-y-3">
              {report.gradeDistribution.map((item) => {
                const width = report.summary.totalStudents ? Math.max((item.count / report.summary.totalStudents) * 100, 8) : 0;
                return (
                  <div key={item.gradeLevel ?? "none"} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.gradeLevel ? `Lớp ${item.gradeLevel}` : "Chưa phân lớp"}</span>
                      <span className="text-slate-500">{item.count} học sinh</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <SectionTitle
              title="Nhật ký vận hành"
              description="Một số tín hiệu nhanh để admin theo dõi nhịp hoạt động của hệ thống."
            />
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tỷ lệ active</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {report.summary.totalStudents ? Math.round((report.summary.activeStudents7d / report.summary.totalStudents) * 100) : 0}%
                </p>
                <p className="mt-1 text-sm text-slate-500">Học sinh có hoạt động trong 7 ngày gần nhất</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mật độ phiên học</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {report.summary.totalStudents ? (report.summary.totalSessions / report.summary.totalStudents).toFixed(1) : "0.0"}
                </p>
                <p className="mt-1 text-sm text-slate-500">Số phiên học trung bình trên mỗi học sinh</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <SectionTitle
              title="Tác vụ nhanh"
              description="Đi tới các khu vực vận hành thường dùng mà không phải rời dashboard."
            />
            <div className="mt-5 space-y-2">
              {[
                { href: "/admin/students", label: "Đi tới quản lý học sinh" },
                { href: "/admin/subjects", label: "Đi tới quản lý môn học" },
                { href: "/admin/assignments", label: "Đi tới giao bài tập" },
                { href: "/admin/achievements", label: "Đi tới quản lý thành tựu" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-200 hover:bg-white"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard({ progress, hasAchievements }: { progress: ProgressData; hasAchievements: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div className={`grid grid-cols-2 gap-4 ${hasAchievements ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <StatCard icon={TrendingUp} label="Giờ học (tuần)" value={progress.stats.weeklyStudyHours || 0} color="text-blue-600" bgColor="bg-blue-100" />
          <StatCard icon={Target} label="Điểm trung bình" value={progress.stats.averageScore || 0} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard icon={CheckCircle} label="Bài tập AI" value={progress.stats.completedExercises || 0} color="text-brand-600" bgColor="bg-brand-100" />
          {hasAchievements && (
            <StatCard
              icon={Award}
              label="Thành tích"
              value={`${progress.stats.achievementCount || 0}/${progress.stats.totalAchievements || 0}`}
              color="text-amber-500"
              bgColor="bg-amber-100"
            />
          )}
        </div>

        <section className="space-y-3">
          <h3 className="px-2 text-lg font-bold text-slate-800">Hoạt động gần đây</h3>
          {progress.recentActivity.length > 0 ? (
            progress.recentActivity.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100/80">
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
        </section>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="px-2 text-lg font-bold text-slate-800">Mục tiêu tuần</h3>
          <div className="grid grid-cols-7 gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-4">
            {progress.weeklyProgress.map((day, index) => (
              <div key={`${day.day}-${index}`} className="text-center">
                <div className="text-xs font-bold text-slate-500">{day.day}</div>
                <div className={cn("my-2 mx-auto h-10 w-10 rounded-lg", day.completed ? "bg-brand-200" : "bg-slate-100")} />
                <div className="text-[11px] font-medium text-slate-400">{day.hours}h</div>
              </div>
            ))}
          </div>
        </section>

        {hasAchievements && (
          <section className="space-y-3">
            <h3 className="px-2 text-lg font-bold text-slate-800">Thành tích đã đạt được</h3>
            <div className="grid grid-cols-2 gap-3">
              {progress.achievements.map((ach) => (
                <div key={ach.id} className={cn("rounded-xl p-3", ach.unlocked ? "border border-amber-200/90 bg-amber-100/80" : "bg-slate-100/80")}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ach.icon}</span>
                    <p className={cn("text-sm font-bold", ach.unlocked ? "text-amber-900" : "text-slate-600")}>{ach.title}</p>
                  </div>
                  <p className={cn("mt-1 text-xs", ach.unlocked ? "text-amber-700" : "text-slate-500")}>{ach.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl bg-slate-800 p-6 text-white">
          <h3 className="text-lg font-bold">Ghi chú nhanh</h3>
          <textarea
            className="mt-3 w-full resize-none rounded-lg border-slate-600 bg-slate-700 p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Viết nhanh một ý tưởng..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

function ParentDashboard({ report }: { report: ParentReportData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Theo dõi con</h2>
        <p className="text-sm text-slate-500">Báo cáo nhanh thời lượng học và mức độ hoạt động của từng hồ sơ học sinh.</p>
      </div>
      <div className="space-y-3">
        {report.children.map((student) => (
          <div key={student.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white/88 p-4 md:grid-cols-[minmax(0,1fr),130px,140px,140px] md:items-center">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{student.fullName || student.email}</p>
              <p className="truncate text-sm text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Thời lượng học</p>
              <p className="text-sm font-semibold text-slate-900">{formatStudyTime(student.totalStudySeconds, true)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phiên học</p>
              <p className="text-sm font-semibold text-slate-900">{student.totalSessions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Hoạt động gần nhất</p>
              <p className="text-sm font-semibold text-slate-900">{formatLastActive(student.lastActive)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const reportResponse = await fetch("/api/reports/study-time");
        if (!reportResponse.ok) {
          throw new Error("Failed to load study report");
        }

        const reportData = await reportResponse.json();
        setReport(reportData);

        if (user?.role === "STUDENT") {
          const progressResponse = await fetch("/api/progress");
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setProgress(progressData);
          } else {
            setProgress(null);
          }
        } else {
          setProgress(null);
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
  }, [user?.role]);

  const pageTitle = useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return "Bảng điều hành quản trị";
      case "PARENT":
        return "Báo cáo học tập của con";
      default:
        return "Tổng quan học tập";
    }
  }, [user?.role]);

  const hasAchievements = (progress?.achievements?.length || 0) > 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500">Đang tải không gian học tập của bạn...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-sm text-slate-500">
        Không tải được dữ liệu dashboard.
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10 font-sans">
      {user?.role !== "ADMIN" && (
        <div className="flex items-center justify-between">
          <div>
            <BlockIcon icon={BookOpen} color="text-brand-600" bgColor="bg-brand-100" />
            <h1 className="mt-3 font-serif text-3xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-slate-500">Không gian học tập cá nhân của bạn.</p>
          </div>
          {user?.role === "STUDENT" && (
            <Link href="/courses">
              <Button className="h-11 rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Vào học
              </Button>
            </Link>
          )}
        </div>
      )}

      {user?.role === "ADMIN" && report.role === "ADMIN" && <AdminDashboard report={report} />}
      {user?.role === "PARENT" && report.role === "PARENT" && <ParentDashboard report={report} />}
      {user?.role === "STUDENT" && progress && <StudentDashboard progress={progress} hasAchievements={hasAchievements} />}
    </div>
  );
}
