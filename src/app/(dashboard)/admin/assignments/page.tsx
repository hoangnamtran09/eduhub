"use client";

import { useEffect, useMemo, useState } from "react";
import { BookCheck, CalendarClock, CheckCircle2, ClipboardCheck, Loader2, Plus, Send, Users } from "lucide-react";
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
  dueDate: string | null;
  maxScore: number;
  targetGradeLevel: number | null;
  lesson: LessonOption | null;
  recipients: AssignmentRecipient[];
}

const gradeOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function AdminAssignmentsPage() {
  const user = useAuthStore((state) => state.user);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    lessonId: "",
    dueDate: "",
    maxScore: "10",
    targetGradeLevel: "",
  });

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

      setAssignments(assignmentData);
      setStudents(studentData);

      const lessonOptions = (subjectData || []).flatMap((subject: any) =>
        (subject.lessons || []).map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
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

  const filteredStudents = useMemo(() => {
    if (!form.targetGradeLevel) {
      return students;
    }

    return students.filter((student) => String(student.gradeLevel || "") === form.targetGradeLevel);
  }, [form.targetGradeLevel, students]);

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
    };
  }, [assignments]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    );
  };

  const handleCreateAssignment = async () => {
    if (!form.title.trim() || !form.description.trim()) return;

    setSubmitting(true);
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
        throw new Error("Failed to create assignment");
      }

      setForm({
        title: "",
        description: "",
        lessonId: "",
        dueDate: "",
        maxScore: "10",
        targetGradeLevel: "",
      });
      setSelectedStudents([]);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-500" />
          <p className="font-medium text-slate-500">Đang tải bài tập được giao...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffdf7_0%,_#f8fafc_36%,_#eef2ff_100%)] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-violet-700">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Assignment Studio
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Giao bài tập cho học sinh</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                  Admin có thể giao bài tập theo từng học sinh hoặc theo khối lớp, gắn với bài học hiện có và theo dõi trạng thái nộp ngay trên dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Bài đã giao" value={stats.totalAssignments} icon={BookCheck} tone="violet" />
              <StatCard label="Lượt nhận" value={stats.totalRecipients} icon={Users} tone="sky" />
              <StatCard label="Đã nộp" value={stats.submittedRecipients} icon={CheckCircle2} tone="emerald" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tạo đợt giao bài mới</h2>
                  <p className="text-sm text-slate-500">Thiết lập nội dung, hạn nộp và đối tượng nhận bài.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Tên bài tập" className="h-12 rounded-2xl" />
                <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} className="h-12 rounded-2xl" />
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Mô tả yêu cầu, tiêu chí chấm, cách nộp bài..."
                className="min-h-[160px] w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/5"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <select
                  value={form.lessonId}
                  onChange={(e) => setForm((current) => ({ ...current, lessonId: e.target.value }))}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-brand-300"
                >
                  <option value="">Gắn với bài học</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{lesson.subjectName} • {lesson.title}</option>
                  ))}
                </select>

                <select
                  value={form.targetGradeLevel}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((current) => ({ ...current, targetGradeLevel: value }));
                    setSelectedStudents([]);
                  }}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-brand-300"
                >
                  <option value="">Chọn khối lớp</option>
                  {gradeOptions.filter(Boolean).map((grade) => (
                    <option key={grade} value={grade}>Lớp {grade}</option>
                  ))}
                </select>

                <Input value={form.maxScore} onChange={(e) => setForm((current) => ({ ...current, maxScore: e.target.value }))} placeholder="Điểm tối đa" className="h-12 rounded-2xl" />
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Chọn học sinh nhận bài</h3>
                    <p className="text-xs text-slate-500">Nếu không chọn thủ công, hệ thống sẽ giao cho toàn bộ học sinh trong khối lớp đã chọn.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{selectedStudents.length} đã chọn</span>
                </div>

                <div className="grid max-h-[280px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredStudents.map((student) => {
                    const selected = selectedStudents.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          selected ? "border-brand-300 bg-brand-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="font-semibold text-slate-900">{student.fullName || student.email}</div>
                        <div className="mt-1 text-xs text-slate-500">{student.email}</div>
                        <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleCreateAssignment} disabled={submitting} className="h-12 rounded-2xl px-6">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Giao bài tập
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submittedCount = assignment.recipients.filter((recipient) => recipient.status === "submitted").length;
              return (
                <Card key={assignment.id} className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{assignment.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {assignment.maxScore} điểm
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <InfoPill icon={CalendarClock} label={assignment.dueDate ? new Date(assignment.dueDate).toLocaleString("vi-VN") : "Chưa đặt hạn"} />
                      <InfoPill icon={BookCheck} label={assignment.lesson ? assignment.lesson.title : "Bài tập tự do"} />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <span>Tiến độ nộp bài</span>
                        <span>{submittedCount}/{assignment.recipients.length}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${assignment.recipients.length ? (submittedCount / assignment.recipients.length) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {assignment.recipients.slice(0, 6).map((recipient) => (
                        <span key={recipient.id} className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          recipient.status === "submitted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {(recipient.student.fullName || recipient.student.email).split(" ").slice(0, 2).join(" ")}
                        </span>
                      ))}
                      {assignment.recipients.length > 6 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">+{assignment.recipients.length - 6} học sinh</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "violet" | "sky" | "emerald" }) {
  const toneClasses = {
    violet: "from-violet-500 to-fuchsia-400",
    sky: "from-sky-500 to-cyan-400",
    emerald: "from-emerald-500 to-teal-400",
  };

  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white", toneClasses[tone])}>
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

function InfoPill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="line-clamp-1">{label}</span>
    </div>
  );
}
