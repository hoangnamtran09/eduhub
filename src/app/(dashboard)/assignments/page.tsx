"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { BookOpenCheck, Bot, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Download, FileText, Loader2, RotateCcw, Search, Send, SlidersHorizontal, Upload, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AssignmentRecipientStatus, isAssignmentOverdue, isAssignmentPending, isAssignmentSubmitted, normalizeAssignmentStatus } from "@/types/assignment";
import { toast } from "sonner";

const MAX_SUBMISSION_FILES = 5;
const MAX_SUBMISSION_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(size?: number) {
  if (!size || size <= 0) return null;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getSubmissionPreviewType(file: { type: string; name: string }) {
  if (file.type.startsWith("image/")) return "image" as const;
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf" as const;
  return "file" as const;
}

interface StudentAssignment {
  id: string;
  status: AssignmentRecipientStatus;
  submissionText: string | null;
  submissionFiles?: Array<{ name: string; url: string; type: string; size?: number }> | null;
  score?: number | null;
  aiScore?: number | null;
  feedback?: string | null;
  rubricScores?: Array<{ criterionId: string; title: string; score: number; maxScore: number; comment?: string }> | null;
  feedbackEvents?: Array<{ status: AssignmentRecipientStatus; score?: number | null; feedback?: string | null; createdAt: string; attemptCount?: number }> | null;
  submittedAt: string | null;
  reviewedAt?: string | null;
  returnedAt?: string | null;
  attemptCount?: number;
  assignment: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    maxScore: number;
    pdfUrl: string | null;
    lesson: {
      id: string;
      title: string;
      subjectId: string;
      subject: {
        name: string;
      };
    } | null;
  };
}

type ParentAssignmentStats = {
  total: number;
  pending: number;
  accepted: number;
  submitted: number;
  reviewed: number;
  returned: number;
  overdue: number;
  dueSoon: number;
};

type ParentAssignment = StudentAssignment & {
  childId: string;
  childName: string;
  childEmail: string;
  childGradeLevel: number | null;
};

type ParentAssignmentChild = {
  id: string;
  name: string;
  email: string;
  gradeLevel: number | null;
  stats: ParentAssignmentStats;
  assignments: ParentAssignment[];
};

type ParentAssignmentsResponse = {
  role: "PARENT";
  children: ParentAssignmentChild[];
  summary: ParentAssignmentStats & {
    totalChildren: number;
    totalAssignments: number;
  };
};

type ParentFilter = "priority" | "all" | "overdue" | "dueSoon" | "pending" | "submitted" | "reviewed" | "returned";

export default function AssignmentsPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "PARENT") {
    return <ParentAssignmentsView />;
  }

  return <StudentAssignmentsView />;
}

function StudentAssignmentsView() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<StudentAssignment | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSubmission, setUploadingSubmission] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<Array<{ name: string; url: string; type: string; size?: number }>>([]);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "submitted" | "reviewed" | "returned" | "overdue">("all");

  const loadAssignments = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to load assignments");
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setError("Không tải được danh sách bài tập. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const stats = useMemo(() => {
    const accepted = items.filter((item) => normalizeAssignmentStatus(item.status) === "accepted").length;
    const submitted = items.filter((item) => normalizeAssignmentStatus(item.status) === "submitted").length;
    const reviewed = items.filter((item) => normalizeAssignmentStatus(item.status) === "reviewed").length;
    const returned = items.filter((item) => normalizeAssignmentStatus(item.status) === "returned").length;
    const pending = items.filter((item) => isAssignmentPending(item.status)).length;
    const overdue = items.filter((item) => isAssignmentOverdue(item.status, item.assignment.dueDate)).length;

    return { accepted, submitted, reviewed, returned, pending, overdue };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const normalizedStatus = normalizeAssignmentStatus(item.status);
      const isAccepted = normalizedStatus === "accepted";
      const isSubmitted = normalizedStatus === "submitted";
      const isOverdue = isAssignmentOverdue(item.status, item.assignment.dueDate);
      const isReviewed = normalizedStatus === "reviewed";
      const isReturned = normalizedStatus === "returned";
      const statusMatch = statusFilter === "all"
        || (statusFilter === "accepted" && isAccepted)
        || (statusFilter === "submitted" && isSubmitted)
        || (statusFilter === "reviewed" && isReviewed)
        || (statusFilter === "returned" && isReturned)
        || (statusFilter === "pending" && isAssignmentPending(item.status))
        || (statusFilter === "overdue" && isOverdue);
      const haystack = [
        item.assignment.title,
        item.assignment.description,
        item.assignment.lesson?.title,
        item.assignment.lesson?.subject.name,
      ].filter(Boolean).join(" ").toLowerCase();

      return statusMatch && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [items, query, statusFilter]);

  const handleAcceptAssignment = async (recipientId: string, pdfUrl: string | null) => {
    setAccepting(true);
    setActionMessage(null);
    try {
      // Cập nhật trạng thái
      const response = await fetch(`/api/assignments/${recipientId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to accept assignment");
      }

      // Tải PDF nếu có
      if (pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${selectedAssignment?.assignment.title || 'bai-tap'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      await loadAssignments();
      setSelectedAssignment(null);
      setActionMessage({ type: "success", message: "Đã nhận bài tập. Bạn có thể nộp bài khi hoàn thành." });
      toast.success("Đã nhận bài tập");
      window.dispatchEvent(new CustomEvent("assignment-notifications-updated"));
    } catch (error) {
      console.error(error);
      setActionMessage({ type: "error", message: "Không thể nhận bài tập. Vui lòng thử lại." });
      toast.error("Không thể nhận bài tập");
    } finally {
      setAccepting(false);
    }
  };

  const openSubmitDialog = (assignment: StudentAssignment) => {
    setSubmittingAssignment(assignment);
    setSubmissionText(assignment.submissionText || "");
    setSubmissionFiles(assignment.submissionFiles || []);
    setPreviewFileUrl((assignment.submissionFiles || [])[0]?.url || null);
    setActionMessage(null);
  };

  const removeSubmissionFile = (fileUrl: string) => {
    setSubmissionFiles((current) => {
      const next = current.filter((item) => item.url !== fileUrl);
      setPreviewFileUrl((currentPreview) => (currentPreview === fileUrl ? next[0]?.url || null : currentPreview));
      return next;
    });
    setActionMessage(null);
  };

  const handleSubmissionFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (submissionFiles.length >= MAX_SUBMISSION_FILES) {
      setActionMessage({ type: "error", message: `Bạn chỉ có thể đính kèm tối đa ${MAX_SUBMISSION_FILES} file.` });
      event.target.value = "";
      return;
    }

    const duplicateFile = submissionFiles.some((item) => item.name === file.name && item.size === file.size);
    if (duplicateFile) {
      setActionMessage({ type: "error", message: "File này đã có trong danh sách đính kèm." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SUBMISSION_FILE_SIZE_BYTES) {
      setActionMessage({ type: "error", message: "Mỗi file đính kèm chỉ được tối đa 10MB." });
      event.target.value = "";
      return;
    }

    setUploadingSubmission(true);
    setActionMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/assignments/upload-submission", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải file");
      setSubmissionFiles((current) => {
        const next = [...current, { name: data.name, url: data.url, type: data.type, size: data.size }].slice(0, MAX_SUBMISSION_FILES);
        setPreviewFileUrl(data.url);
        return next;
      });
      toast.success("Đã tải file lên");
    } catch (error) {
      setActionMessage({ type: "error", message: error instanceof Error ? error.message : "Không thể tải file" });
      toast.error(error instanceof Error ? error.message : "Không thể tải file");
    } finally {
      setUploadingSubmission(false);
      event.target.value = "";
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submittingAssignment || submitting || (!submissionText.trim() && submissionFiles.length === 0)) return;

    setSubmitting(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/assignments/${submittingAssignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText, submissionFiles }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể nộp bài");
      }

      await loadAssignments();
      setSubmittingAssignment(null);
      setSubmissionText("");
      setSubmissionFiles([]);
      setPreviewFileUrl(null);
      setActionMessage({ type: "success", message: "Đã nộp bài thành công." });
      toast.success("Đã nộp bài thành công");
      window.dispatchEvent(new CustomEvent("assignment-notifications-updated"));
    } catch (error) {
      setActionMessage({ type: "error", message: error instanceof Error ? error.message : "Không thể nộp bài" });
      toast.error(error instanceof Error ? error.message : "Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-500" />
          <p className="font-medium text-slate-500">Đang tải bài tập của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                <ClipboardList className="h-3.5 w-3.5" />
                Bài tập
              </span>
              <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Bài tập được giao</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Xem và nhận bài tập được giao từ giáo viên.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
              <SmallStat label="Chưa nhận" value={stats.pending} />
              <SmallStat label="Đã nhận" value={stats.accepted} />
              <SmallStat label="Đã nộp" value={stats.submitted} />
              <SmallStat label="Đã chấm" value={stats.reviewed} />
              <SmallStat label="Cần sửa" value={stats.returned} />
              <SmallStat label="Quá hạn" value={stats.overdue} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên bài, môn học hoặc mô tả..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="relative block">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chưa nhận</option>
                <option value="accepted">Đã nhận</option>
                <option value="submitted">Đã nộp</option>
                <option value="reviewed">Đã chấm</option>
                <option value="returned">Cần sửa</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}
        {actionMessage && (
          <div className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-medium",
            actionMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700",
          )}>
            {actionMessage.message}
          </div>
        )}

        <div className="space-y-5">
          {filteredItems.map((item) => {
            const normalizedStatus = normalizeAssignmentStatus(item.status);
            const isAccepted = normalizedStatus === "accepted";
            const isSubmitted = isAssignmentSubmitted(item.status);
            const isReviewed = normalizedStatus === "reviewed";
            const isReturned = normalizedStatus === "returned";
            const isOverdue = isAssignmentOverdue(item.status, item.assignment.dueDate);

            return (
              <Card key={item.id} className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
                <div className={cn(
                  "px-6 py-5",
                  isReviewed ? "bg-emerald-50" : isReturned ? "bg-orange-50" : isSubmitted ? "bg-sky-50" : isAccepted ? "bg-emerald-50" : isOverdue ? "bg-rose-50" : "bg-amber-50"
                )}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>{item.assignment.lesson?.subject.name || "Bài tập tự do"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{item.assignment.maxScore} điểm</span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.assignment.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.assignment.description}</p>
                    </div>

                    <span className={cn(
                      "rounded-md px-4 py-2 text-xs font-semibold",
                      isReviewed ? "bg-emerald-100 text-emerald-700" : isReturned ? "bg-orange-100 text-orange-700" : isSubmitted ? "bg-sky-100 text-sky-700" : isAccepted ? "bg-emerald-100 text-emerald-700" : isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {isReviewed ? "Đã chấm" : isReturned ? "Cần sửa" : isSubmitted ? "Đã nộp" : isAccepted ? "Đã nhận" : isOverdue ? "Quá hạn" : "Chưa nhận"}
                    </span>
                  </div>
                </div>

                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    <MetaRow icon={CalendarClock} text={item.assignment.dueDate ? `Hạn nộp: ${new Date(item.assignment.dueDate).toLocaleString("vi-VN")}` : "Không có hạn nộp"} />
                    <MetaRow icon={BookOpenCheck} text={item.assignment.lesson ? `Bài học: ${item.assignment.lesson.title}` : "Không gắn với bài học"} />
                  </div>

                  {!isAccepted && !isSubmitted && (
                    <Button
                      onClick={() => setSelectedAssignment(item)}
                      className="w-full"
                    >
                      Xem chi tiết và nhận bài tập
                    </Button>
                  )}

                  {isAccepted && (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Bạn đã nhận bài tập này. Hãy nộp bài sau khi hoàn thành.</span>
                      </div>
                      <Button onClick={() => openSubmitDialog(item)} className="gap-2">
                        <Send className="h-4 w-4" />
                        Nộp bài
                      </Button>
                    </div>
                  )}

                  {normalizedStatus === "submitted" && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã nộp bài {item.submittedAt ? `lúc ${new Date(item.submittedAt).toLocaleString("vi-VN")}` : ""}</span>
                    </div>
                  )}
                  {isReviewed && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Giáo viên đã chấm bài {item.reviewedAt ? `lúc ${new Date(item.reviewedAt).toLocaleString("vi-VN")}` : ""}</span>
                    </div>
                  )}
                  {isReturned && item.returnedAt && (
                    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      <RotateCcw className="h-4 w-4" />
                      <span>Bài đã được trả để chỉnh sửa lúc {new Date(item.returnedAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                  {isReturned && (
                    <Button onClick={() => openSubmitDialog(item)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                      <RotateCcw className="h-4 w-4" />
                      Nộp lại bài đã sửa
                    </Button>
                  )}
                  {isAssignmentSubmitted(item.status) && item.submissionText && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nội dung đã nộp</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.submissionText}</p>
                    </div>
                  )}
                  {isAssignmentSubmitted(item.status) && !!item.submissionFiles?.length && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">File đã nộp</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.submissionFiles.map((file) => (
                          <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                            <FileText className="h-3.5 w-3.5" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.aiScore != null && normalizedStatus === "submitted" && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600">
                        <Bot className="h-3.5 w-3.5" /> Chấm sơ bộ AI
                      </p>
                      <p className="mt-2 text-sm font-bold text-violet-900">Điểm AI: {item.aiScore}/{item.assignment.maxScore}</p>
                      {item.feedback && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-violet-800">{item.feedback}</p>}
                      {Array.isArray(item.rubricScores) && item.rubricScores.length > 0 && (
                        <div className="mt-2 grid gap-1">
                          {item.rubricScores.map((rs) => (
                            <div key={rs.criterionId} className="flex justify-between text-xs text-violet-700">
                              <span>{rs.title}</span>
                              <span className="font-medium">{rs.score}/{rs.maxScore}{rs.comment ? ` – ${rs.comment}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-violet-500">Đây là điểm sơ bộ từ AI. Giáo viên sẽ xem xét và cho điểm chính thức.</p>
                    </div>
                  )}
                  {(normalizedStatus === "reviewed" || (normalizedStatus === "returned" && item.feedback)) && (
                    <div className={cn(
                      "rounded-lg border px-4 py-3",
                      normalizedStatus === "reviewed" ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"
                    )}>
                      <p className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        normalizedStatus === "reviewed" ? "text-emerald-600" : "text-orange-600"
                      )}>
                        {normalizedStatus === "reviewed" ? "Kết quả chấm" : "Phản hồi giáo viên – Cần sửa"}
                      </p>
                      {typeof item.score === "number" && (
                        <p className={cn("mt-2 text-sm font-bold", normalizedStatus === "reviewed" ? "text-emerald-900" : "text-orange-900")}>
                          Điểm: {item.score}/{item.assignment.maxScore}
                        </p>
                      )}
                      {item.feedback && (
                        <p className={cn("mt-2 whitespace-pre-line text-sm leading-6", normalizedStatus === "reviewed" ? "text-emerald-900" : "text-orange-900")}>
                          {item.feedback}
                        </p>
                      )}
                      {Array.isArray(item.rubricScores) && item.rubricScores.length > 0 && (
                        <div className="mt-3 grid gap-1">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Chi tiết rubric:</p>
                          {item.rubricScores.map((rs) => (
                            <div key={rs.criterionId} className="flex justify-between text-xs text-slate-700">
                              <span>{rs.title}</span>
                              <span className="font-medium">{rs.score}/{rs.maxScore}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {(item.attemptCount ?? 0) > 1 && (
                    <p className="text-xs text-slate-400">Lần nộp thứ {item.attemptCount}</p>
                  )}
                  {!!item.feedbackEvents?.length && (
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lịch sử phản hồi ({item.feedbackEvents.length})</p>
                      <div className="mt-2 space-y-2">
                        {item.feedbackEvents.map((entry, index) => (
                          <div key={`${entry.createdAt}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            <div className="flex justify-between gap-3 text-xs font-semibold text-slate-500">
                              <span>{normalizeAssignmentStatus(entry.status) === "returned" ? "Trả bài sửa" : "Đã chấm"}{entry.attemptCount ? ` (lần ${entry.attemptCount})` : ""}</span>
                              <span>{new Date(entry.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                            {entry.score != null && <p className="mt-1 text-xs font-semibold">Điểm: {entry.score}/{item.assignment.maxScore}</p>}
                            {entry.feedback && <p className="mt-1 whitespace-pre-line">{entry.feedback}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-soft">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-700">Chưa có bài tập nào được giao</h2>
              <p className="mt-2 text-sm text-slate-500">Khi giáo viên giao bài, danh sách sẽ xuất hiện tại đây.</p>
            </div>
          )}
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-soft">
              <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-700">Không tìm thấy bài tập phù hợp</h2>
              <p className="mt-2 text-sm text-slate-500">Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
            </div>
          )}
        </div>
      </div>

      {/* Popup chi tiết bài tập */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.assignment.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Mô tả</h3>
              <p className="text-sm text-slate-600">{selectedAssignment?.assignment.description}</p>
            </div>

            {selectedAssignment?.assignment.lesson && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Bài học liên quan</h3>
                <div className="rounded-lg border border-ink-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{selectedAssignment.assignment.lesson.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedAssignment.assignment.lesson.subject.name}</p>
                </div>
              </div>
            )}

            {selectedAssignment?.assignment.dueDate && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Hạn nộp</h3>
                <p className="text-sm text-slate-600">{new Date(selectedAssignment.assignment.dueDate).toLocaleString("vi-VN")}</p>
              </div>
            )}

            {selectedAssignment?.assignment.pdfUrl && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-brand-700">
                  <Download className="h-4 w-4" />
                  <span>Bài tập có file PDF đính kèm, sẽ tự động tải về khi bạn nhận bài</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)}>Đóng</Button>
            <Button 
              onClick={() => handleAcceptAssignment(selectedAssignment!.id, selectedAssignment!.assignment.pdfUrl)}
              disabled={accepting}
            >
              {accepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Nhận bài tập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!submittingAssignment} onOpenChange={(open) => {
        if (!open) {
          setSubmittingAssignment(null);
          setPreviewFileUrl(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nộp bài tập</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-semibold text-slate-900">{submittingAssignment?.assignment.title}</p>
              <p className="mt-1 text-sm text-slate-500">Nhập nội dung bài làm, đường dẫn file hoặc ghi chú nộp bài của bạn.</p>
            </div>
            <Textarea
              value={submissionText}
              onChange={(event) => setSubmissionText(event.target.value)}
              placeholder="Ví dụ: Em đã hoàn thành bài. Link file: https://..."
              className="min-h-40 rounded-2xl border-slate-200 bg-white text-sm leading-6"
            />
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                {uploadingSubmission ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Tải file đính kèm (PDF, ảnh, Word, Excel...)
                <input type="file" className="hidden" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={handleSubmissionFileUpload} disabled={uploadingSubmission} />
              </label>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <p>Tối đa {MAX_SUBMISSION_FILES} file, mỗi file không quá 10MB. Hỗ trợ PDF, ảnh, Word, Excel, PowerPoint và TXT.</p>
                <span>{submissionFiles.length}/{MAX_SUBMISSION_FILES} file</span>
              </div>
              {!!submissionFiles.length && (
                <div className="mt-3 space-y-3">
                  {submissionFiles.map((file) => (
                    <div key={file.url} className={cn(
                      "flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200 transition",
                      previewFileUrl === file.url && "ring-2 ring-brand-200"
                    )}>
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left font-semibold hover:text-slate-900" onClick={() => setPreviewFileUrl(file.url)}>
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        {formatFileSize(file.size) && <span className="shrink-0 text-slate-400">{formatFileSize(file.size)}</span>}
                      </button>
                      <div className="flex items-center gap-1">
                        <a href={file.url} target="_blank" rel="noreferrer" className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                          Mở
                        </a>
                        <button
                          type="button"
                          className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                          onClick={() => removeSubmissionFile(file.url)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}

                  {previewFileUrl && (() => {
                    const previewFile = submissionFiles.find((file) => file.url === previewFileUrl);
                    if (!previewFile) return null;

                    const previewType = getSubmissionPreviewType(previewFile);

                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Xem trước file đính kèm</p>
                            <p className="text-xs text-slate-500">{previewFile.name}</p>
                          </div>
                          <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                            Mở tab mới
                          </a>
                        </div>

                        {previewType === "image" && (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <Image
                              src={previewFile.url}
                              alt={previewFile.name}
                              width={1200}
                              height={800}
                              className="h-auto max-h-[420px] w-full object-contain"
                              unoptimized
                            />
                          </div>
                        )}

                        {previewType === "pdf" && (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <iframe
                              src={previewFile.url}
                              title={`Preview ${previewFile.name}`}
                              className="h-[420px] w-full"
                            />
                          </div>
                        )}

                        {previewType === "file" && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium text-slate-700">Loại file này chưa có preview trực tiếp</p>
                            <p className="mt-1 text-xs text-slate-500">Bạn vẫn có thể mở file ở tab mới để kiểm tra trước khi nộp.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmittingAssignment(null)} disabled={submitting}>Hủy</Button>
            <Button onClick={handleSubmitAssignment} disabled={submitting || (!submissionText.trim() && submissionFiles.length === 0)}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParentAssignmentsView() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<ParentAssignmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("all");
  const [filter, setFilter] = useState<ParentFilter>("priority");
  const [selectedAssignment, setSelectedAssignment] = useState<ParentAssignment | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/assignments");
      if (!response.ok) throw new Error("Failed to load parent assignments");
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error("Failed to load parent assignments:", error);
      setError("Không tải được danh sách bài tập. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const assignments = useMemo(() => data?.children.flatMap((child) => child.assignments) || [], [data]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const normalizedStatus = normalizeAssignmentStatus(item.status);
      const childMatch = selectedChildId === "all" || item.childId === selectedChildId;
      const isOverdue = isAssignmentOverdue(item.status, item.assignment.dueDate);
      const isDueSoon = isParentAssignmentDueSoon(item);
      const statusMatch = filter === "all"
        || (filter === "priority" && (isOverdue || isDueSoon || normalizedStatus === "returned" || normalizedStatus === "assigned" || normalizedStatus === "accepted"))
        || (filter === "overdue" && isOverdue)
        || (filter === "dueSoon" && isDueSoon)
        || (filter === "pending" && (normalizedStatus === "assigned" || normalizedStatus === "accepted"))
        || (filter === "submitted" && normalizedStatus === "submitted")
        || (filter === "reviewed" && normalizedStatus === "reviewed")
        || (filter === "returned" && normalizedStatus === "returned");

      return childMatch && statusMatch;
    });
  }, [assignments, filter, selectedChildId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2e8] px-6">
        <div className="rounded-[2rem] border border-amber-200 bg-white px-6 py-8 text-center shadow-soft">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-600" />
          <p className="font-semibold text-stone-700">Đang tải bài tập của con...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-stone-950">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-[#f7f2e8]/95 px-4 pb-4 pt-5 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Phụ huynh</p>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">Bài tập của con</h1>
            <p className="mt-1 max-w-xs text-sm leading-5 text-stone-600">Theo dõi hạn nộp, trạng thái và phản hồi giáo viên trong một màn hình.</p>
          </div>
          <div className="rounded-2xl bg-stone-950 px-3 py-2 text-right text-white shadow-lg shadow-stone-300">
            <p className="text-2xl font-black leading-none">{data?.summary.totalChildren ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-100">học sinh</p>
          </div>
        </div>
      </div>

      <main className="space-y-4 px-4 py-4">
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <ParentMetric label="Quá hạn" value={data?.summary.overdue ?? 0} tone="danger" onClick={() => setFilter("overdue")} />
          <ParentMetric label="Sắp hạn" value={data?.summary.dueSoon ?? 0} tone="warn" onClick={() => setFilter("dueSoon")} />
          <ParentMetric label="Chờ làm" value={(data?.summary.pending ?? 0) + (data?.summary.accepted ?? 0)} tone="ink" onClick={() => setFilter("pending")} />
          <ParentMetric label="Cần sửa" value={data?.summary.returned ?? 0} tone="orange" onClick={() => setFilter("returned")} />
        </div>

        {!!data?.children.length && (
          <div className="-mx-4 overflow-x-auto px-4 pb-1">
            <div className="flex min-w-max gap-2">
              <ParentChip active={selectedChildId === "all"} onClick={() => setSelectedChildId("all")}>Tất cả</ParentChip>
              {data.children.map((child) => (
                <ParentChip key={child.id} active={selectedChildId === child.id} onClick={() => setSelectedChildId(child.id)}>
                  {child.name}
                  {(child.stats.overdue + child.stats.dueSoon + child.stats.returned) > 0 && (
                    <span className="ml-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">{child.stats.overdue + child.stats.dueSoon + child.stats.returned}</span>
                  )}
                </ParentChip>
              ))}
            </div>
          </div>
        )}

        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex min-w-max gap-2">
            {([
              ["priority", "Ưu tiên"],
              ["all", "Tất cả"],
              ["overdue", "Quá hạn"],
              ["dueSoon", "Sắp hạn"],
              ["pending", "Chờ làm"],
              ["submitted", "Đã nộp"],
              ["reviewed", "Đã chấm"],
              ["returned", "Cần sửa"],
            ] as Array<[ParentFilter, string]>).map(([value, label]) => (
              <ParentChip key={value} active={filter === value} onClick={() => setFilter(value)}>{label}</ParentChip>
            ))}
          </div>
        </div>

        {!data?.children.length && (
          <ParentEmpty icon={UserRound} title="Chưa có học sinh liên kết" body="Tài khoản phụ huynh này chưa được gán học sinh. Vui lòng liên hệ quản trị viên." />
        )}

        {!!data?.children.length && assignments.length === 0 && (
          <ParentEmpty icon={ClipboardList} title="Chưa có bài tập nào" body="Khi giáo viên giao bài, danh sách sẽ hiển thị tại đây." />
        )}

        {assignments.length > 0 && filteredAssignments.length === 0 && (
          <ParentEmpty icon={Search} title="Không có bài phù hợp" body="Thử đổi bộ lọc con hoặc trạng thái để xem thêm bài tập." />
        )}

        <div className="space-y-3">
          {filteredAssignments.map((item) => (
            <ParentAssignmentCard key={item.id} item={item} onOpen={() => setSelectedAssignment(item)} />
          ))}
        </div>
      </main>

      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left font-serif text-2xl">{selectedAssignment?.assignment.title}</DialogTitle>
          </DialogHeader>
          {selectedAssignment && <ParentAssignmentDetail item={selectedAssignment} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)} className="w-full rounded-2xl">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isParentAssignmentDueSoon(item: { status: AssignmentRecipientStatus; assignment: { dueDate: string | null } }) {
  if (!item.assignment.dueDate || isAssignmentSubmitted(item.status)) return false;
  const dueTime = new Date(item.assignment.dueDate).getTime();
  const now = Date.now();
  return dueTime >= now && dueTime <= now + 3 * 24 * 60 * 60 * 1000;
}

function getParentStatusLabel(item: ParentAssignment) {
  const normalizedStatus = normalizeAssignmentStatus(item.status);
  if (isAssignmentOverdue(item.status, item.assignment.dueDate)) return "Quá hạn";
  if (isParentAssignmentDueSoon(item)) return "Sắp hạn";
  if (normalizedStatus === "returned") return "Cần sửa";
  if (normalizedStatus === "reviewed") return "Đã chấm";
  if (normalizedStatus === "submitted") return "Đã nộp";
  if (normalizedStatus === "accepted") return "Đang làm";
  return "Chưa nhận";
}

function ParentMetric({ label, value, tone, onClick }: { label: string; value: number; tone: "danger" | "warn" | "ink" | "orange"; onClick: () => void }) {
  const tones = {
    danger: "bg-rose-600 text-white shadow-rose-200",
    warn: "bg-amber-400 text-stone-950 shadow-amber-200",
    ink: "bg-stone-950 text-white shadow-stone-300",
    orange: "bg-orange-500 text-white shadow-orange-200",
  };

  return (
    <button onClick={onClick} className={cn("rounded-[1.6rem] p-4 text-left shadow-lg transition active:scale-[0.98]", tones[tone])}>
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-wider opacity-85">{label}</p>
    </button>
  );
}

function ParentChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition active:scale-95",
      active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-700 shadow-sm"
    )}>
      {children}
    </button>
  );
}

function ParentAssignmentCard({ item, onOpen }: { item: ParentAssignment; onOpen: () => void }) {
  const label = getParentStatusLabel(item);
  const urgent = label === "Quá hạn" || label === "Sắp hạn" || label === "Cần sửa";

  return (
    <button onClick={onOpen} className={cn(
      "w-full rounded-[1.75rem] border bg-white p-4 text-left shadow-soft transition active:scale-[0.99]",
      urgent ? "border-amber-300" : "border-stone-200"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider text-stone-500">
            <span>{item.childName}</span>
            <span className="h-1 w-1 rounded-full bg-stone-300" />
            <span>{item.assignment.lesson?.subject.name || "Bài tập"}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-stone-950">{item.assignment.title}</h2>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-black",
          label === "Quá hạn" ? "bg-rose-100 text-rose-700" : label === "Sắp hạn" ? "bg-amber-100 text-amber-800" : label === "Cần sửa" ? "bg-orange-100 text-orange-700" : label === "Đã chấm" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"
        )}>{label}</span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-stone-600">
        <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-amber-700" />{item.assignment.dueDate ? new Date(item.assignment.dueDate).toLocaleString("vi-VN") : "Không có hạn nộp"}</div>
        <div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-amber-700" />{item.assignment.lesson?.title || "Chưa gắn bài học"}</div>
      </div>

      {(item.score != null || item.aiScore != null || item.feedback) && (
        <div className="mt-4 rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {item.score != null && <p className="font-bold">Điểm giáo viên: {item.score}/{item.assignment.maxScore}</p>}
          {item.aiScore != null && <p className="font-bold">Điểm AI: {item.aiScore}/{item.assignment.maxScore}</p>}
          {item.feedback && <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{item.feedback}</p>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm font-bold text-stone-950">
        <span>Xem chi tiết</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}

function ParentAssignmentDetail({ item }: { item: ParentAssignment }) {
  return (
    <div className="space-y-4 text-sm text-stone-700">
      <div className="rounded-2xl bg-amber-50 px-4 py-3">
        <p className="font-black text-stone-950">{item.childName}</p>
        <p className="mt-1 text-xs text-stone-500">{item.childGradeLevel ? `Lớp ${item.childGradeLevel}` : item.childEmail}</p>
      </div>

      <div className="grid gap-2">
        <MetaRow icon={CalendarClock} text={item.assignment.dueDate ? `Hạn nộp: ${new Date(item.assignment.dueDate).toLocaleString("vi-VN")}` : "Không có hạn nộp"} />
        <MetaRow icon={BookOpenCheck} text={item.assignment.lesson ? `${item.assignment.lesson.subject.name} · ${item.assignment.lesson.title}` : "Bài tập tự do"} />
      </div>

      <div>
        <p className="font-black text-stone-950">Mô tả</p>
        <p className="mt-2 whitespace-pre-line leading-6">{item.assignment.description}</p>
      </div>

      {item.assignment.pdfUrl && (
        <a href={item.assignment.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 font-bold text-white">
          <Download className="h-4 w-4" />
          Mở đề bài
        </a>
      )}

      {item.submissionText && (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <p className="font-black text-stone-950">Nội dung con đã nộp</p>
          <p className="mt-2 whitespace-pre-line leading-6">{item.submissionText}</p>
        </div>
      )}

      {!!item.submissionFiles?.length && (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <p className="font-black text-stone-950">File đã nộp</p>
          <div className="mt-3 space-y-2">
            {item.submissionFiles.map((file) => (
              <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2 font-semibold text-stone-700">
                <span className="truncate">{file.name}</span>
                <FileText className="h-4 w-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {(item.score != null || item.aiScore != null || item.feedback) && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="font-black text-emerald-950">Kết quả & phản hồi</p>
          {item.score != null && <p className="mt-2 font-bold">Điểm giáo viên: {item.score}/{item.assignment.maxScore}</p>}
          {item.aiScore != null && <p className="mt-1 font-bold">Điểm AI: {item.aiScore}/{item.assignment.maxScore}</p>}
          {item.feedback && <p className="mt-2 whitespace-pre-line leading-6">{item.feedback}</p>}
        </div>
      )}

      {!!item.feedbackEvents?.length && (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <p className="font-black text-stone-950">Lịch sử phản hồi</p>
          <div className="mt-3 space-y-2">
            {item.feedbackEvents.map((entry, index) => (
              <div key={`${entry.createdAt}-${index}`} className="rounded-xl bg-stone-50 p-3 text-xs leading-5">
                <div className="flex justify-between gap-2 font-bold text-stone-600">
                  <span>{normalizeAssignmentStatus(entry.status) === "returned" ? "Trả bài sửa" : "Đã chấm"}</span>
                  <span>{new Date(entry.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                {entry.score != null && <p className="mt-1 font-semibold">Điểm: {entry.score}/{item.assignment.maxScore}</p>}
                {entry.feedback && <p className="mt-1 whitespace-pre-line">{entry.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParentEmpty({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-12 text-center shadow-soft">
      <Icon className="mx-auto mb-4 h-11 w-11 text-amber-600" />
      <h2 className="text-xl font-black text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{body}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-center shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MetaRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-brand-500" />
      <span>{text}</span>
    </div>
  );
}
