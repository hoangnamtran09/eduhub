"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Loader2,
  Search,
  Plus,
  Sparkles,
  Send,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface StudentOption {
  id: string;
  email: string;
  fullName: string | null;
  gradeLevel: number | null;
}

interface LessonOption {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
}

interface AssignmentRecipient {
  id: string;
  status: string;
  submittedAt: string | null;
  student: StudentOption;
}

interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string | null;
  dueDate: string | null;
  maxScore: number;
  targetGradeLevel: number | null;
  lesson: LessonOption | null;
  recipients: AssignmentRecipient[];
}

const gradeOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const emptyForm = {
  title: "",
  description: "",
  pdfUrl: "",
  subjectId: "",
  lessonId: "",
  dueDate: "",
  maxScore: "10",
  targetGradeLevel: "",
};

export default function AdminAssignmentsPage() {
  const user = useAuthStore((state) => state.user);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [lessonSearchQuery, setLessonSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "pending">("all");
  const [assignmentPdfName, setAssignmentPdfName] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentRes, studentRes, subjectRes] = await Promise.all([
        fetch("/api/admin/assignments"),
        fetch("/api/admin/students"),
        fetch("/api/admin/subjects"),
      ]);

      const [assignmentData, studentData, subjectData] = await Promise.all([
        assignmentRes.json(),
        studentRes.json(),
        subjectRes.json(),
      ]);

      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);

      const normalizedSubjects = Array.isArray(subjectData) ? subjectData : [];
      const lessonOptions = normalizedSubjects.flatMap((subject: any) =>
        (subject.lessons || []).map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          subjectId: subject.id,
          subjectName: subject.name,
        }))
      );

      setLessons(lessonOptions);
    } catch (error) {
      console.error("Failed to load admin assignments page:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;

    if (showCreateModal) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    }

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, [showCreateModal]);

  const filteredStudents = useMemo(() => {
    if (!form.targetGradeLevel) {
      return students;
    }

    return students.filter((student) => String(student.gradeLevel || "") === form.targetGradeLevel);
  }, [form.targetGradeLevel, students]);

  const visibleStudents = useMemo(() => {
    const normalizedQuery = studentSearchQuery.trim().toLowerCase();

    return filteredStudents.filter((student) => {
      if (!normalizedQuery) return true;

      return (
        (student.fullName || "").toLowerCase().includes(normalizedQuery) ||
        student.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filteredStudents, studentSearchQuery]);

  const subjectOptions = useMemo(() => {
    const subjectMap = new Map<string, { id: string; name: string }>();

    lessons.forEach((lesson) => {
      if (!subjectMap.has(lesson.subjectId)) {
        subjectMap.set(lesson.subjectId, {
          id: lesson.subjectId,
          name: lesson.subjectName,
        });
      }
    });

    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (!form.subjectId) {
      return [];
    }

    const normalizedQuery = lessonSearchQuery.trim().toLowerCase();

    return lessons.filter((lesson) => {
      if (lesson.subjectId !== form.subjectId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return lesson.title.toLowerCase().includes(normalizedQuery);
    });
  }, [form.subjectId, lessonSearchQuery, lessons]);

  const stats = useMemo(() => {
    const totalRecipients = assignments.reduce((sum, assignment) => sum + assignment.recipients.length, 0);
    const submittedRecipients = assignments.reduce(
      (sum, assignment) => sum + assignment.recipients.filter((recipient) => recipient.status === "submitted").length,
      0
    );

    return {
      totalAssignments: assignments.length,
      totalRecipients,
      submittedRecipients,
      completionRate: totalRecipients ? Math.round((submittedRecipients / totalRecipients) * 100) : 0,
    };
  }, [assignments]);

  const visibleAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const submittedCount = assignment.recipients.filter((recipient) => recipient.status === "submitted").length;
      const pendingCount = assignment.recipients.length - submittedCount;

      const matchesQuery =
        !normalizedQuery ||
        assignment.title.toLowerCase().includes(normalizedQuery) ||
        assignment.description.toLowerCase().includes(normalizedQuery) ||
        assignment.lesson?.title.toLowerCase().includes(normalizedQuery) ||
        assignment.lesson?.subjectName.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "submitted" && submittedCount > 0) ||
        (statusFilter === "pending" && pendingCount > 0);

      return matchesQuery && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  const hasRecipientSelection = selectedStudents.length > 0 || Boolean(form.targetGradeLevel);

  const toggleStudent = (studentId: string) => {
    setSubmitError("");
    setSelectedStudents((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    );
  };

const closeModal = () => {
    setShowCreateModal(false);
    setForm(emptyForm);
    setSelectedStudents([]);
    setStudentSearchQuery("");
    setLessonSearchQuery("");
    setAssignmentPdfName("");
    setSubmitError("");
  };

  const handleCreateAssignment = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setSubmitError("Vui lòng nhập đầy đủ tên bài tập và mô tả.");
      return;
    }

    if (!hasRecipientSelection) {
      setSubmitError("Vui lòng chọn học sinh hoặc chọn khối lớp để giao bài tập.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          studentIds: selectedStudents,
          createdById: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create assignment");
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo bài tập.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentPdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      event.target.value = "";
      return;
    }

    try {
      setUploadingPdf(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/assignments/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload assignment PDF");
      }

      const data = await response.json();
      setForm((current) => ({ ...current, pdfUrl: data.fileUrl }));
      setAssignmentPdfName(data.fileName || file.name);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingPdf(false);
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-500" />
          <p className="font-medium text-slate-500">Đang tải danh sách bài tập đã giao...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
            <div className="relative px-6 py-6 md:px-8 md:py-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_28%)]" />
              <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_340px] xl:items-end">
                <div className="space-y-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-600 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    Assignment Studio
                  </span>

                  <div className="space-y-3">
                    <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 md:text-[42px]">
                      Thiết kế lại khu vực giao bài tập để admin theo dõi nhanh, giao chính xác và nhìn rõ tiến độ nộp bài.
                    </h1>
                    <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                      Bố cục mới ưu tiên thao tác giao bài theo đợt, kết hợp tổng quan hiệu suất, bộ lọc ngay đầu trang và từng thẻ bài tập với trạng thái trực quan hơn.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Tạo đợt giao bài
                    </Button>
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <ClipboardCheck className="h-4 w-4 text-slate-500" />
                      {visibleAssignments.length} mục hiển thị theo bộ lọc hiện tại
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Tỷ lệ hoàn thành</div>
                      <div className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{stats.completionRate}%</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Lượt nhận" value={stats.totalRecipients} />
                    <MiniMetric label="Đã nộp" value={stats.submittedRecipients} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 md:grid-cols-3 md:px-8">
              <StatCard label="Bài đã giao" value={stats.totalAssignments} icon={BookCheck} tone="violet" />
              <StatCard label="Lượt nhận" value={stats.totalRecipients} icon={Users} tone="sky" />
              <StatCard label="Đã nộp" value={stats.submittedRecipients} icon={CheckCircle2} tone="emerald" />
            </div>
          </section>

          <section className="rounded-[36px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 lg:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo tên bài tập, mô tả hoặc bài học"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "submitted", label: "Có bài đã nộp" },
                  { value: "pending", label: "Còn chờ nộp" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value as "all" | "submitted" | "pending")}
                    className={cn(
                      "rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                      statusFilter === filter.value
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-3 md:px-4 md:py-4">
              <section className="space-y-3">
            {visibleAssignments.length ? (
              visibleAssignments.map((assignment) => {
                const submittedCount = assignment.recipients.filter((recipient) => recipient.status === "submitted").length;
                const percent = assignment.recipients.length
                  ? (submittedCount / assignment.recipients.length) * 100
                  : 0;

                return (
                  <Card key={assignment.id} className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-none transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                    <CardContent className="p-0">
                      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_320px]">
                        <div className="p-5 md:p-6">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                              {assignment.maxScore} điểm
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                              {assignment.targetGradeLevel ? `Khối ${assignment.targetGradeLevel}` : "Giao tùy chọn"}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                              {assignment.recipients.length} học sinh nhận
                            </span>
                          </div>

                          <div>
                            <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-slate-950">{assignment.title}</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 line-clamp-2">{assignment.description}</p>
                          </div>

                          {assignment.pdfUrl && (
                            <a
                              href={assignment.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Xem file PDF đính kèm
                            </a>
                          )}

                          <div className="grid gap-2 md:grid-cols-3">
                            <InfoPill icon={CalendarClock} label={assignment.dueDate ? new Date(assignment.dueDate).toLocaleString("vi-VN") : "Chưa đặt hạn nộp"} />
                            <InfoPill icon={BookCheck} label={assignment.lesson ? assignment.lesson.title : "Bài tập tự do"} />
                            <InfoPill icon={Users} label={assignment.lesson ? assignment.lesson.subjectName : "Không gắn môn học"} />
                          </div>
                        </div>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-950 p-5 text-white xl:border-l xl:border-t-0 xl:border-slate-800/80">
                          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tiến độ nộp bài</span>
                              <span className="text-sm font-semibold text-white">{submittedCount}/{assignment.recipients.length}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="mt-3 text-xs text-slate-400">{percent.toFixed(0)}% học sinh đã gửi bài</div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {assignment.recipients.slice(0, 8).map((recipient) => (
                                <span
                                  key={recipient.id}
                                  className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                    recipient.status === "submitted"
                                      ? "bg-emerald-400/15 text-emerald-300"
                                      : "bg-amber-300/15 text-amber-200"
                                  )}
                                >
                                  {(recipient.student.fullName || recipient.student.email).split(" ").slice(0, 2).join(" ")}
                                </span>
                              ))}
                              {assignment.recipients.length > 8 && (
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                                  +{assignment.recipients.length - 8} học sinh
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-100 text-slate-500 shadow-inner">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Chưa có bài tập phù hợp</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Hãy tạo một đợt giao bài mới bằng nút dấu cộng phía trên hoặc thay đổi bộ lọc để xem các bài tập khác.
                </p>
              </div>
            )}
              </section>
            </div>
          </section>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-[0_36px_120px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 md:px-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tạo bài tập</div>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-slate-950">Tạo đợt giao bài mới</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeModal} className="text-slate-500 hover:text-slate-900">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="max-h-[calc(94vh-88px)] overflow-y-auto px-6 py-6 md:px-8">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_380px]">
                <div className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(255,255,255,1))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Nội dung bài tập</div>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">Thiết lập thông tin chính</h3>
                      </div>
                      <div className="rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">Bước 1</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Tên bài tập"
                      className="h-12"
                    />
                    <Input
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    placeholder="Mô tả yêu cầu, tiêu chí chấm, cách nộp bài..."
                    className="min-h-[180px] w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/5"
                  />

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">File PDF bài tập</h3>
                        <p className="text-xs text-slate-500">Tải lên đề bài hoặc tài liệu hướng dẫn để học sinh xem trực tiếp từ assignment.</p>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300">
                        {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingPdf ? "Đang tải PDF..." : "Tải PDF lên"}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleAssignmentPdfUpload}
                          disabled={uploadingPdf}
                        />
                      </label>
                    </div>

                    {form.pdfUrl && (
                      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">{assignmentPdfName || "assignment.pdf"}</div>
                            <div className="text-xs text-slate-500">File PDF đã sẵn sàng để đính kèm vào bài tập</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={form.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Xem file
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((current) => ({ ...current, pdfUrl: "" }));
                              setAssignmentPdfName("");
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Gỡ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ngữ cảnh học tập</div>
                        <h3 className="mt-2 text-base font-semibold text-slate-950">Liên kết môn học và phạm vi lớp</h3>
                      </div>
                      <div className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Bước 2</div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <select
                      value={form.subjectId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((current) => ({ ...current, subjectId: value, lessonId: "" }));
                        setLessonSearchQuery("");
                      }}
                      className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15"
                    >
                      <option value="">Chọn môn học</option>
                      {subjectOptions.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={lessonSearchQuery}
                        onChange={(event) => setLessonSearchQuery(event.target.value)}
                        placeholder={form.subjectId ? "Tìm bài học theo tên" : "Chọn môn trước để tìm bài"}
                        className="h-12 border-slate-200 pl-11"
                        disabled={!form.subjectId}
                      />
                    </div>

                    <select
                      value={form.lessonId}
                      onChange={(e) => setForm((current) => ({ ...current, lessonId: e.target.value }))}
                      className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15"
                      disabled={!form.subjectId}
                    >
                      <option value="">{form.subjectId ? "Chọn bài học" : "Chọn môn trước"}</option>
                      {filteredLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>

                    </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <select
                      value={form.targetGradeLevel}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((current) => ({ ...current, targetGradeLevel: value }));
                        setSelectedStudents([]);
                        setStudentSearchQuery("");
                        setSubmitError("");
                      }}
                      className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15"
                    >
                      <option value="">Chọn khối lớp</option>
                      {gradeOptions.filter(Boolean).map((grade) => (
                        <option key={grade} value={grade}>
                          Lớp {grade}
                        </option>
                      ))}
                    </select>

                    <Input
                      value={form.maxScore}
                      onChange={(e) => setForm((current) => ({ ...current, maxScore: e.target.value }))}
                      placeholder="Điểm tối đa"
                      className="h-12"
                      />
                  </div>

                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                    Nếu không chọn học sinh thủ công, hệ thống sẽ tự giao cho toàn bộ học sinh thuộc khối lớp đã chọn.
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tóm tắt giao bài</div>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">Kiểm tra nhanh trước khi gửi</h3>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <SummaryRow label="Tên bài" value={form.title.trim() || "Chưa nhập"} />
                      <SummaryRow label="Hạn nộp" value={form.dueDate || "Chưa đặt"} />
                      <SummaryRow label="Môn học" value={subjectOptions.find((subject) => subject.id === form.subjectId)?.name || "Chưa chọn"} />
                      <SummaryRow label="Bài học" value={filteredLessons.find((lesson) => lesson.id === form.lessonId)?.title || "Chưa chọn"} />
                      <SummaryRow label="Khối lớp" value={form.targetGradeLevel ? `Lớp ${form.targetGradeLevel}` : "Chưa giới hạn"} />
                      <SummaryRow label="Đã chọn tay" value={`${selectedStudents.length} học sinh`} />
                      <SummaryRow label="PDF" value={form.pdfUrl ? (assignmentPdfName || "Đã đính kèm") : "Chưa có file"} />
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">Chọn học sinh nhận bài</h3>
                        <p className="text-xs text-slate-500">Danh sách lọc theo khối lớp nếu đã chọn.</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                        {selectedStudents.length} đã chọn
                      </span>
                    </div>

                    <div className="relative mb-4">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={studentSearchQuery}
                        onChange={(event) => {
                          setStudentSearchQuery(event.target.value);
                          setSubmitError("");
                        }}
                        placeholder="Tìm theo tên hoặc email học sinh"
                        className="h-11 border-slate-200 bg-white pl-11"
                      />
                    </div>

                    <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1 xl:max-h-[620px]">
                      {visibleStudents.length ? visibleStudents.map((student) => {
                        const selected = selectedStudents.includes(student.id);
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => toggleStudent(student.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                              selected
                                ? "border-brand-300 bg-brand-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-slate-900">{student.fullName || student.email}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">{student.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                                {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                              </span>
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
                                  selected
                                    ? "border-brand-500 bg-brand-500 text-white"
                                    : "border-slate-300 bg-white text-transparent"
                                )}
                              >
                                ✓
                              </span>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                          Không tìm thấy học sinh phù hợp với từ khóa hiện tại.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeModal} className="h-12 px-6">
                  Hủy
                </Button>
                <Button type="button" onClick={handleCreateAssignment} disabled={submitting || uploadingPdf} className="h-12 px-6">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Giao bài tập
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "violet" | "sky" | "emerald" }) {
  const toneClasses = {
    violet: "bg-slate-900 text-white",
    sky: "bg-slate-900 text-white",
    emerald: "bg-slate-900 text-white",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="text-xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-white">{value}</span>
    </div>
  );
}

function InfoPill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="line-clamp-1">{label}</span>
    </div>
  );
}
