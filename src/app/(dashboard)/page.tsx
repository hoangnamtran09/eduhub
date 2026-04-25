"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle,
  Clock,
  Layers3,
  Loader2,
  Play,
  ShieldAlert,
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

interface ParentAlertItem {
  type: string;
  level: "critical" | "warning" | "good";
  label: string;
}

interface ParentAssignmentItem {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  lessonTitle: string | null;
}

interface ParentActivityItem {
  id: string;
  startedAt: string;
  durationSec: number;
  lessonTitle: string | null;
}

interface ParentChildItem extends ReportStudentItem {
  assignmentSummary: {
    total: number;
    pending: number;
    submitted: number;
    overdue: number;
    dueSoon: number;
  };
  weaknessSummary: {
    count: number;
    topics: string[];
  };
  recentAssignments: ParentAssignmentItem[];
  recentActivity: ParentActivityItem[];
  alertSummary: {
    level: "critical" | "warning" | "good";
    criticalCount: number;
    warningCount: number;
    items: ParentAlertItem[];
  };
}

interface ParentReportData {
  role: "PARENT";
  summary: {
    totalChildren: number;
    activeChildren7d: number;
    childrenNeedingAttention: number;
    totalPendingAssignments: number;
    totalOverdueAssignments: number;
    totalDueSoonAssignments: number;
  };
  children: ParentChildItem[];
  spotlightAlerts: Array<ParentAlertItem & {
    childId: string;
    childName: string;
    childGradeLevel: number | null;
  }>;
  assignmentWatchlist: Array<ParentAssignmentItem & {
    childId: string;
    childName: string;
    childGradeLevel: number | null;
  }>;
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
  leaderboard?: Array<{
    id: string;
    fullName: string | null;
    gradeLevel: number | null;
    totalStudySeconds: number;
    totalSessions: number;
    lastActive: string | null;
    rank: number;
    isCurrentUser: boolean;
  }>;
  currentStudentRank?: number | null;
  peers?: Array<{
    id: string;
    fullName: string | null;
    gradeLevel: number | null;
    totalStudySeconds: number;
    totalSessions: number;
    lastActive: string | null;
  }>;
  communitySummary?: {
    totalVisiblePeers: number;
    activePeers7d: number;
  };
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
    pendingAssignments?: number;
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

function formatDueDate(date: string | null | undefined) {
  if (!date) return "Chưa có hạn nộp";
  return new Date(date).toLocaleDateString("vi-VN");
}

function getAssignmentStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case "submitted":
      return "Da nop";
    case "accepted":
      return "Da nhan";
    default:
      return "Cho xu ly";
  }
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

function StudentDashboard({ report, progress, hasAchievements }: { report: StudentReportData; progress: ProgressData; hasAchievements: boolean }) {
  const leaderboard = report.leaderboard || [];
  const peers = report.peers || [];
  const currentLeaderboardEntry = leaderboard.find((student) => student.isCurrentUser);
  const todaysProgress = progress.weeklyProgress[progress.weeklyProgress.length - 1];
  const nextActions = [
    {
      href: "/courses",
      icon: Play,
      title: todaysProgress?.completed ? "Tiếp tục một bài học mới" : "Hoàn thành phiên học hôm nay",
      description: todaysProgress?.completed
        ? "Bạn đã có hoạt động hôm nay. Học thêm một bài ngắn để tăng tốc tiến độ."
        : "Bắt đầu một phiên học để giữ nhịp và cập nhật chuỗi học.",
      tone: "bg-slate-900 text-white border-slate-900",
    },
    {
      href: "/mistakes",
      icon: BrainCircuit,
      title: "Ôn vùng kiến thức yếu",
      description: "Xem các chủ đề hệ thống phát hiện cần củng cố và bắt đầu ôn lại.",
      tone: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      href: "/assignments",
      icon: CalendarClock,
      title: "Kiểm tra bài tập được giao",
      description: progress.stats.pendingAssignments
        ? `${progress.stats.pendingAssignments} bài đang cần xử lý hoặc nộp bài.`
        : "Đảm bảo không bỏ lỡ bài sắp đến hạn hoặc bài giáo viên mới giao.",
      tone: "bg-amber-50 text-amber-800 border-amber-200",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Student Workspace
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Không gian học tập cá nhân</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Theo dõi tiến độ của bạn, nhìn thấy bạn học khác và giữ nhịp học ổn định với bảng xếp hạng theo thời lượng học tập.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses">
              <Button className="h-11 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Vào học ngay
              </Button>
            </Link>
            <Link href="/progress">
              <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                <TrendingUp className="mr-2 h-4 w-4" />
                Xem tiến độ
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#162033_100%)] p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Snapshot cá nhân</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/65">Vị trí bảng xếp hạng</p>
              <p className="mt-1 text-2xl font-semibold text-white">{report.currentStudentRank ? `#${report.currentStudentRank}` : "Chưa xếp hạng"}</p>
              <p className="mt-1 text-xs text-white/50">
                {currentLeaderboardEntry
                  ? `${formatStudyTime(currentLeaderboardEntry.totalStudySeconds, true)} • ${currentLeaderboardEntry.totalSessions} phiên học`
                  : "Bắt đầu học để xuất hiện trên bảng xếp hạng"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Bạn học hiển thị</p>
                <p className="mt-1 text-xl font-semibold">{report.communitySummary?.totalVisiblePeers ?? peers.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Hoạt động 7 ngày</p>
                <p className="mt-1 text-xl font-semibold">{report.communitySummary?.activePeers7d || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={TrendingUp} label="Giờ học (tuần)" value={progress.stats.weeklyStudyHours || 0} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Target} label="Điểm trung bình" value={progress.stats.averageScore || 0} color="text-emerald-600" bgColor="bg-emerald-100" />
        <StatCard icon={CheckCircle} label="Bài tập AI" value={progress.stats.completedExercises || 0} color="text-brand-600" bgColor="bg-brand-100" />
        <StatCard icon={Award} label="Chuỗi học" value={progress.stats.streakDays || 0} color="text-amber-500" bgColor="bg-amber-100" />
      </div>

      <section className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            title="Việc nên làm hôm nay"
            description="Các bước ưu tiên để biến dữ liệu tiến độ thành hành động học tập cụ thể."
          />
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {todaysProgress?.completed ? "Hôm nay đã active" : "Chưa có phiên hôm nay"}
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {nextActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn("group rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg", action.tone)}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/70 p-2 text-slate-900 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{action.title}</p>
                    <p className="mt-1 text-sm leading-5 opacity-75">{action.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-80">
                      Bắt đầu <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle
                title="Bảng xếp hạng học tập"
                description="Xếp hạng theo tổng thời lượng học đã ghi nhận. Bạn có thể thấy vị trí của mình so với các bạn học khác."
              />
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {leaderboard.length} vị trí hiển thị
              </div>
            </div>
            <div className="space-y-3">
              {leaderboard.map((student) => (
                <div
                  key={student.id}
                  className={cn(
                    "grid gap-3 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[44px,minmax(0,1fr),120px,120px,140px] lg:items-center",
                    student.isCurrentUser ? "bg-brand-50/70 ring-1 ring-brand-200" : "bg-slate-50/70",
                  )}
                >
                  <div className="text-sm font-semibold text-slate-500">#{student.rank}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{student.fullName || "Học sinh"}</p>
                      {student.isCurrentUser && (
                        <span className="rounded-full bg-brand-100 px-2 py-1 text-[11px] font-medium text-brand-700">Bạn</span>
                      )}
                    </div>
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
              {!leaderboard.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Chưa có bảng xếp hạng để hiển thị.
                </div>
              )}
            </div>
          </section>

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
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <SectionTitle
              title="Bạn học của bạn"
              description="Một số học sinh khác đang học cùng khối lớp hoặc cùng hệ thống để bạn dễ theo dõi nhịp học chung."
            />
            <div className="mt-5 space-y-3">
              {peers.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{student.fullName || "Học sinh"}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</p>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {student.totalSessions} phiên
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatStudyTime(student.totalStudySeconds, true)}</span>
                    <span>{formatLastActive(student.lastActive)}</span>
                  </div>
                </div>
              ))}
              {!peers.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Chưa có danh sách bạn học để hiển thị.
                </div>
              )}
            </div>
          </section>

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
        </div>
      </div>
    </div>
  );
}

function ParentDashboard({ report }: { report: ParentReportData }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Parent Workspace
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Bang dieu hanh phu huynh</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Uu tien theo doi bai tap, canh bao hoc tap va muc do hoat dong gan day cua tung con trong cung mot man hinh.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#162033_100%)] p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Canh bao tong hop</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/65">Con can uu tien</p>
              <p className="mt-1 text-2xl font-semibold text-white">{report.summary.childrenNeedingAttention}</p>
              <p className="mt-1 text-xs text-white/50">{report.summary.totalOverdueAssignments} bai qua han va {report.summary.totalDueSoonAssignments} bai sap den han</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Hoat dong 7 ngay</p>
                <p className="mt-1 text-xl font-semibold">{report.summary.activeChildren7d}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Bai dang mo</p>
                <p className="mt-1 text-xl font-semibold">{report.summary.totalPendingAssignments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="So con dang theo doi" value={report.summary.totalChildren} color="text-sky-600" bgColor="bg-sky-100" />
        <StatCard icon={Activity} label="Hoat dong 7 ngay" value={report.summary.activeChildren7d} detail={`${Math.max(report.summary.totalChildren - report.summary.activeChildren7d, 0)} con can nhac nho`} color="text-emerald-600" bgColor="bg-emerald-100" />
        <StatCard icon={BookOpen} label="Bai tap cho xu ly" value={report.summary.totalPendingAssignments} detail={`${report.summary.totalDueSoonAssignments} bai sap den han`} color="text-violet-600" bgColor="bg-violet-100" />
        <StatCard icon={ShieldAlert} label="Qua han" value={report.summary.totalOverdueAssignments} detail={`${report.summary.childrenNeedingAttention} ho so can uu tien`} color="text-rose-600" bgColor="bg-rose-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr),minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle title="Canh bao uu tien" description="Tong hop cac tin hieu can phu huynh xu ly som nhat." />
              <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{report.spotlightAlerts.length} canh bao</div>
            </div>
            <div className="space-y-3">
              {report.spotlightAlerts.map((alert, index) => (
                <div key={`${alert.childId}-${alert.type}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className={cn("mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl", alert.level === "critical" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600")}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{alert.childName}</p>
                    <p className="text-sm text-slate-600">{alert.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{alert.childGradeLevel ? `Lop ${alert.childGradeLevel}` : "Chua phan lop"}</p>
                  </div>
                </div>
              ))}
              {!report.spotlightAlerts.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Chua co canh bao nao can xu ly ngay.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle title="Theo doi bai tap" description="Danh sach bai tap sap den han hoac can phu huynh nhac con xu ly." />
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{report.assignmentWatchlist.length} muc</div>
            </div>
            <div className="space-y-3">
              {report.assignmentWatchlist.map((assignment) => (
                <div key={`${assignment.childId}-${assignment.id}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{assignment.title}</p>
                      <p className="truncate text-sm text-slate-500">{assignment.childName} • {assignment.lessonTitle || "Chua gan bai hoc"}</p>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">{getAssignmentStatusLabel(assignment.status)}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-200/70 px-2.5 py-1 font-medium text-slate-700">Han nop: {formatDueDate(assignment.dueDate)}</span>
                    {assignment.childGradeLevel && <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">Lop {assignment.childGradeLevel}</span>}
                  </div>
                </div>
              ))}
              {!report.assignmentWatchlist.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Chua co bai tap nao can theo doi.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <SectionTitle title="Tong quan tung con" description="Tap trung vao nhip hoc, bai tap ton dong va cac chu de can cung co." />
            <div className="mt-5 space-y-3">
              {report.children.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{student.fullName || student.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.gradeLevel ? `Lop ${student.gradeLevel}` : "Chua phan lop"}</p>
                    </div>
                    <div className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", student.alertSummary.level === "critical" ? "bg-rose-100 text-rose-700" : student.alertSummary.level === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                      {student.alertSummary.level === "critical" ? "Can uu tien" : student.alertSummary.level === "warning" ? "Can theo doi" : "On dinh"}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Thoi luong hoc</p>
                      <p className="font-semibold text-slate-900">{formatStudyTime(student.totalStudySeconds, true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Hoat dong gan nhat</p>
                      <p className="font-semibold text-slate-900">{formatLastActive(student.lastActive)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Bai cho xu ly</p>
                      <p className="font-semibold text-slate-900">{student.assignmentSummary.pending}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Chu de yeu</p>
                      <p className="font-semibold text-slate-900">{student.weaknessSummary.count}</p>
                    </div>
                  </div>
                  {!!student.weaknessSummary.topics.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {student.weaknessSummary.topics.map((topic) => (
                        <span key={topic} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">{topic}</span>
                      ))}
                    </div>
                  )}
                  {!!student.recentActivity.length && (
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                      {student.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="truncate">{activity.lessonTitle || "Phien hoc gan day"}</span>
                          <span>{formatStudyTime(activity.durationSec, true)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
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
      {user?.role === "STUDENT" && report.role === "STUDENT" && progress && <StudentDashboard report={report} progress={progress} hasAchievements={hasAchievements} />}
    </div>
  );
}
