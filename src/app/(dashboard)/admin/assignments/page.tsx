"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
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
  const [assignmentPdfName, setAssignmentPdfName] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());

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
        })),
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

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((current) => {
      const next = new Set(current);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  };

  const visibleAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return assignments.filter((assignment) => {
      if (!normalizedQuery) return true;
      return (
        assignment.title.toLowerCase().includes(normalizedQuery) ||
        assignment.description.toLowerCase().includes(normalizedQuery) ||
        assignment.lesson?.title.toLowerCase().includes(normalizedQuery) ||
        assignment.lesson?.subjectName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [assignments, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!form.targetGradeLevel) return students;
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
        subjectMap.set(lesson.subjectId, { id: lesson.subjectId, name: lesson.subjectName });
      }
    });
    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (!form.subjectId) return [];
    const normalizedQuery = lessonSearchQuery.trim().toLowerCase();

    return lessons.filter((lesson) => {
      if (lesson.subjectId !== form.subjectId) return false;
      if (!normalizedQuery) return true;
      return lesson.title.toLowerCase().includes(normalizedQuery);
    });
  }, [form.subjectId, lessonSearchQuery, lessons]);

  const hasRecipientSelection = selectedStudents.length > 0 || Boolean(form.targetGradeLevel);

  const closeModal = () => {
    setShowCreateModal(false);
    setForm(emptyForm);
    setSelectedStudents([]);
    setStudentSearchQuery("");
    setLessonSearchQuery("");
    setAssignmentPdfName("");
    setSubmitError("");
  };

  const toggleStudent = (studentId: string) => {
    setSubmitError("");
    setSelectedStudents((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-brand-500" />
                Giao bài tập
              </h1>
              <p className="text-slate-500 mt-1">Tạo đợt giao bài và theo dõi danh sách học sinh nhận bài</p>
            </div>

            <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:opacity-90">
              <Plus className="w-5 h-5" />
              Thêm bài tập
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo tên bài tập, mô tả hoặc bài học"
                className="pl-11"
              />
            </div>
          </div>

          {!visibleAssignments.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa có bài tập nào</h3>
              <p className="text-slate-500 mb-6">Bắt đầu bằng cách tạo một đợt giao bài mới</p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Tạo bài tập đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAssignments.map((assignment) => {
                const submittedCount = assignment.recipients.filter((recipient) => recipient.status === "submitted").length;

                return (
                  <Card key={assignment.id} className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors bg-gradient-to-r from-brand-500 to-accent-500"
                      onClick={() => toggleAssignment(assignment.id)}
                    >
                      <div className="flex items-center justify-between text-white gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                            <ClipboardCheck className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold truncate">{assignment.title}</h3>
                            <p className="text-white/80 text-sm truncate">
                              {assignment.lesson ? `${assignment.lesson.subjectName} • ${assignment.lesson.title}` : "Bài tập tự do"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold bg-white/15 px-3 py-1 rounded-full">
                            {submittedCount}/{assignment.recipients.length} đã nộp
                          </span>
                          {expandedAssignments.has(assignment.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {expandedAssignments.has(assignment.id) && (
                      <CardContent className="p-4 bg-white space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <InfoRow icon={CalendarClock} label={assignment.dueDate ? `Hạn nộp: ${new Date(assignment.dueDate).toLocaleString("vi-VN")}` : "Chưa đặt hạn nộp"} />
                          <InfoRow icon={BookCheck} label={assignment.lesson ? `Bài học: ${assignment.lesson.title}` : "Không gắn bài học"} />
                          <InfoRow icon={Users} label={assignment.targetGradeLevel ? `Khối lớp: ${assignment.targetGradeLevel}` : `Đã chọn ${assignment.recipients.length} học sinh`} />
                        </div>

                        <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/60">
                          <p className="text-sm font-medium text-slate-900 mb-2">Mô tả bài tập</p>
                          <p className="text-sm text-slate-600 leading-6">{assignment.description}</p>
                          {assignment.pdfUrl && (
                            <a
                              href={assignment.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
                            >
                              <FileText className="w-4 h-4" />
                              Xem file PDF đính kèm
                            </a>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-900">Danh sách học sinh nhận bài</p>
                          {!assignment.recipients.length ? (
                            <div className="text-sm text-slate-400">Chưa có học sinh nhận bài.</div>
                          ) : (
                            assignment.recipients.map((recipient) => (
                              <div key={recipient.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div>
                                  <p className="font-medium text-slate-900">{recipient.student.fullName || recipient.student.email}</p>
                                  <p className="text-xs text-slate-400 mt-1">{recipient.student.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-400">
                                    {recipient.student.gradeLevel ? `Lớp ${recipient.student.gradeLevel}` : "Chưa phân lớp"}
                                  </span>
                                  <span
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                      recipient.status === "submitted"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700",
                                    )}
                                  >
                                    {recipient.status === "submitted" ? "Đã nộp" : "Chờ nộp"}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Thêm bài tập mới</h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(90vh-150px)] overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên bài tập</label>
                  <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="VD: Bài tập chương 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp</label>
                  <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  placeholder="Mô tả yêu cầu, tiêu chí chấm, cách nộp bài..."
                  className="w-full min-h-[140px] px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((current) => ({ ...current, subjectId: value, lessonId: "" }));
                      setLessonSearchQuery("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Chọn môn học</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bài học</label>
                  <select
                    value={form.lessonId}
                    onChange={(e) => setForm((current) => ({ ...current, lessonId: e.target.value }))}
                    disabled={!form.subjectId}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50"
                  >
                    <option value="">{form.subjectId ? "Chọn bài học" : "Chọn môn trước"}</option>
                    {filteredLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={form.targetGradeLevel}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((current) => ({ ...current, targetGradeLevel: value }));
                      setSelectedStudents([]);
                      setStudentSearchQuery("");
                      setSubmitError("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Chọn khối lớp</option>
                    {gradeOptions.filter(Boolean).map((grade) => (
                      <option key={grade} value={grade}>Lớp {grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Điểm tối đa</label>
                  <Input value={form.maxScore} onChange={(e) => setForm((current) => ({ ...current, maxScore: e.target.value }))} placeholder="10" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PDF bài tập</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-600 hover:border-brand-400">
                  {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingPdf ? "Đang tải PDF..." : assignmentPdfName || "Tải PDF lên"}
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleAssignmentPdfUpload} disabled={uploadingPdf} />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Chọn học sinh nhận bài</label>
                  <span className="text-xs text-slate-400">{selectedStudents.length} đã chọn</span>
                </div>

                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={studentSearchQuery}
                    onChange={(event) => setStudentSearchQuery(event.target.value)}
                    placeholder="Tìm theo tên hoặc email học sinh"
                    className="pl-11"
                  />
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 bg-slate-50/60">
                  {visibleStudents.length ? visibleStudents.map((student) => {
                    const selected = selectedStudents.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                          selected ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-slate-900">{student.fullName || student.email}</div>
                          <div className="text-xs text-slate-400 mt-1">{student.email}</div>
                        </div>
                        <span className="text-xs text-slate-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}</span>
                      </button>
                    );
                  }) : (
                    <div className="text-sm text-slate-400 text-center py-6">Không tìm thấy học sinh phù hợp.</div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={closeModal}>Hủy</Button>
              <Button onClick={handleCreateAssignment} disabled={submitting || uploadingPdf} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Giao bài tập
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
      <Icon className="w-4 h-4 text-slate-400" />
      <span>{label}</span>
    </div>
  );
}
