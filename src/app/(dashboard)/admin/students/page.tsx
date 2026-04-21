"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Loader2, PencilLine, Save, Search, Trash2, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface StudentForm {
  id: string;
  email: string;
  fullName: string;
  gradeLevel: string;
  diamonds: string;
  goals: string;
  strengths: string;
  weaknesses: string;
}

const gradeTabs = ["all", "none", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function toLineValue(items?: string[]) {
  return (items || []).join("\n");
}

function toListValue(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createForm(student: StudentRecord): StudentForm {
  return {
    id: student.id,
    email: student.email,
    fullName: student.fullName || "",
    gradeLevel: student.gradeLevel ? String(student.gradeLevel) : "",
    diamonds: String(student.diamonds ?? 0),
    goals: toLineValue(student.profile?.goals),
    strengths: toLineValue(student.profile?.strengths),
    weaknesses: toLineValue(student.profile?.weaknesses),
  };
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/students");
      if (!response.ok) {
        throw new Error("Failed to load students");
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      setStudents(normalized);

      if (!normalized.length) {
        setSelectedStudentId(null);
        setForm(null);
        return;
      }

      const currentId = selectedStudentId && normalized.some((student) => student.id === selectedStudentId)
        ? selectedStudentId
        : normalized[0].id;
      const currentStudent = normalized.find((student) => student.id === currentId) || normalized[0];
      setSelectedStudentId(currentStudent.id);
      setForm(createForm(currentStudent));
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return students.filter((student) => {
      const matchesQuery =
        !normalized ||
        student.fullName?.toLowerCase().includes(normalized) ||
        student.email.toLowerCase().includes(normalized);

      const matchesGrade =
        selectedGrade === "all" ||
        (selectedGrade === "none" && !student.gradeLevel) ||
        String(student.gradeLevel || "") === selectedGrade;

      return matchesQuery && matchesGrade;
    });
  }, [query, selectedGrade, students]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((student) => (student.profile?.streakDays || 0) > 0).length;
    const unassignedClass = students.filter((student) => !student.gradeLevel).length;
    const totalLessons = students.reduce(
      (sum, student) => sum + student.progress.filter((item) => item.completed).length,
      0
    );

    return { totalStudents, activeStudents, unassignedClass, totalLessons };
  }, [students]);

  const openStudent = (student: StudentRecord) => {
    setSelectedStudentId(student.id);
    setForm(createForm(student));
  };

  const handleSave = async () => {
    if (!form) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goals: toListValue(form.goals),
          strengths: toListValue(form.strengths),
          weaknesses: toListValue(form.weaknesses),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update student");
      }

      const updated = await response.json();
      setStudents((current) => current.map((student) => (student.id === updated.id ? updated : student)));
      setSelectedStudentId(updated.id);
      setForm(createForm(updated));
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("Xóa học sinh này khỏi hệ thống? Hành động này không thể hoàn tác.")) {
      return;
    }

    setDeletingId(studentId);
    try {
      const response = await fetch(`/api/admin/students?id=${studentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      const nextStudents = students.filter((student) => student.id !== studentId);
      setStudents(nextStudents);

      if (!nextStudents.length) {
        setSelectedStudentId(null);
        setForm(null);
      } else {
        const nextStudent = nextStudents[0];
        setSelectedStudentId(nextStudent.id);
        setForm(createForm(nextStudent));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-48px)] items-center justify-center rounded-[32px] border border-white/80 bg-white/90 text-slate-600 shadow-panel">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-500" />
          <p>Đang tải dữ liệu học sinh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-48px)] overflow-hidden rounded-[36px] border border-white/80 bg-paper-100/80 text-slate-900 shadow-panel backdrop-blur-sm">
      <div className="grid h-full grid-rows-[auto_auto_1fr]">
        <header className="border-b border-white/80 bg-white/90 px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
               <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Student Management
              </div>
              <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Quản lý học sinh</h1>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi hồ sơ, chỉnh sửa thông tin học sinh và quản trị dữ liệu học tập trong một giao diện vận hành rõ ràng, gọn và ít trang trí.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <AdminStat label="Học sinh" value={stats.totalStudents} icon={Users} />
              <AdminStat label="Đang học" value={stats.activeStudents} icon={BookOpen} />
              <AdminStat label="Chưa phân lớp" value={stats.unassignedClass} icon={AlertTriangle} />
              <AdminStat label="Bài hoàn thành" value={stats.totalLessons} icon={UserRound} />
            </div>
          </div>
        </header>

         <section className="border-b border-white/80 bg-white/90 px-6 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
                 className="h-11 rounded-2xl border-white bg-white pl-11 text-slate-900 placeholder:text-slate-400 shadow-soft"
               />
            </div>
            <div className="flex flex-wrap gap-2">
              {gradeTabs.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setSelectedGrade(grade)}
                  className={cn(
                     "rounded-2xl border px-3 py-2 text-xs font-medium transition",
                     selectedGrade === grade
                      ? "border-brand-200 bg-brand-500 text-white shadow-sm"
                      : "border-white bg-white text-slate-600 shadow-soft hover:border-brand-100 hover:text-slate-900"
                   )}
                >
                  {grade === "all" ? "Tất cả" : grade === "none" ? "Chưa phân lớp" : `Lớp ${grade}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-h-0 grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)]">
           <div className="min-h-0 border-r border-white/70 bg-white/40">
            <div className="flex h-full flex-col">
               <div className="flex items-center justify-between border-b border-white/80 bg-white/90 px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h2>
                  <p className="text-xs text-slate-500">{filteredStudents.length} bản ghi</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {filteredStudents.map((student) => {
                    const isSelected = student.id === selectedStudentId;
                    const completedLessons = student.progress.filter((item) => item.completed).length;

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => openStudent(student)}
                        className={cn(
                           "w-full rounded-[26px] border px-4 py-4 text-left transition-all duration-200",
                           isSelected
                             ? "border-brand-200 bg-slate-900 text-white shadow-lg shadow-slate-200"
                             : "border-white bg-white/95 text-slate-900 shadow-soft hover:border-brand-100"
                         )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{student.fullName || "Chưa cập nhật tên"}</div>
                            <div className={cn("mt-1 truncate text-xs", isSelected ? "text-slate-300" : "text-slate-500")}>{student.email}</div>
                          </div>
                          <span className={cn(
                             "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                             isSelected ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-500"
                           )}>
                            {student.gradeLevel ? `L${student.gradeLevel}` : "None"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <MiniMetric label="KC" value={student.diamonds} active={isSelected} />
                          <MiniMetric label="Khóa" value={student.enrollments.length} active={isSelected} />
                          <MiniMetric label="Xong" value={completedLessons} active={isSelected} />
                        </div>
                      </button>
                    );
                  })}

                  {!filteredStudents.length && (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-soft">
                      Không có học sinh nào phù hợp với bộ lọc hiện tại.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 rounded-r-[36px] bg-white/75 backdrop-blur-sm">
            {selectedStudent && form ? (
              <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
                <div className="border-b border-white/80 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Hồ sơ học sinh</div>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedStudent.fullName || selectedStudent.email}</h2>
                      <p className="mt-1 text-sm text-slate-500">Tạo ngày {new Date(selectedStudent.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForm(createForm(selectedStudent))}
                        className="border-white bg-white text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-soft"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Hoàn tác
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDelete(selectedStudent.id)}
                        disabled={deletingId === selectedStudent.id}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                      >
                        {deletingId === selectedStudent.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 overflow-y-auto bg-transparent px-6 py-5">
                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="border-white/90 bg-white shadow-soft">
                      <CardContent className="space-y-5 p-5">
                        <SectionTitle icon={PencilLine} title="Thông tin cơ bản" />

                        <Field label="Họ và tên">
                          <Input
                            value={form.fullName}
                            onChange={(event) => setForm((current) => current ? { ...current, fullName: event.target.value } : current)}
                            className="border-slate-200 bg-white text-slate-900"
                          />
                        </Field>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Email">
                            <Input
                              value={form.email}
                              onChange={(event) => setForm((current) => current ? { ...current, email: event.target.value } : current)}
                              className="border-slate-200 bg-white text-slate-900"
                            />
                          </Field>

                          <Field label="Khối lớp">
                            <select
                              value={form.gradeLevel}
                              onChange={(event) => setForm((current) => current ? { ...current, gradeLevel: event.target.value } : current)}
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                            >
                              <option value="">Chưa phân lớp</option>
                              {gradeTabs.filter((item) => !["all", "none"].includes(item)).map((grade) => (
                                <option key={grade} value={grade}>Lớp {grade}</option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <Field label="Kim cương">
                          <Input
                            type="number"
                            value={form.diamonds}
                            onChange={(event) => setForm((current) => current ? { ...current, diamonds: event.target.value } : current)}
                            className="border-slate-200 bg-white text-slate-900"
                          />
                        </Field>
                      </CardContent>
                    </Card>

                    <Card className="border-white/90 bg-white shadow-soft">
                      <CardContent className="space-y-4 p-5">
                        <SectionTitle icon={BookOpen} title="Tổng quan học tập" />
                        <InfoGrid
                          items={[
                            { label: "Khóa học", value: String(selectedStudent.enrollments.length) },
                            { label: "Hoàn thành", value: String(selectedStudent.progress.filter((item) => item.completed).length) },
                            { label: "Chuỗi học", value: String(selectedStudent.profile?.streakDays || 0) },
                            { label: "Lần cuối", value: selectedStudent.profile?.lastActive ? new Date(selectedStudent.profile.lastActive).toLocaleDateString("vi-VN") : "Chưa có" },
                          ]}
                        />
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Khóa đang học</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStudent.enrollments.length ? selectedStudent.enrollments.slice(0, 6).map((enrollment, index) => (
                              <span key={enrollment.course?.id || `course-${index}`} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                                {enrollment.course?.title || "Khóa học"}
                              </span>
                            )) : <span className="text-sm text-slate-500">Chưa ghi danh khóa học.</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-white/90 bg-white shadow-soft">
                      <CardContent className="space-y-4 p-5">
                        <SectionTitle icon={UserRound} title="Mục tiêu" />
                        <Field label="Mỗi dòng là một mục tiêu">
                          <textarea
                            value={form.goals}
                            onChange={(event) => setForm((current) => current ? { ...current, goals: event.target.value } : current)}
                            className="min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                          />
                        </Field>
                      </CardContent>
                    </Card>

                    <Card className="border-white/90 bg-white shadow-soft">
                      <CardContent className="space-y-4 p-5">
                        <SectionTitle icon={UserRound} title="Điểm mạnh và điểm yếu" />
                        <Field label="Điểm mạnh - mỗi dòng một ý">
                          <textarea
                            value={form.strengths}
                            onChange={(event) => setForm((current) => current ? { ...current, strengths: event.target.value } : current)}
                            className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                          />
                        </Field>
                        <Field label="Cần cải thiện - mỗi dòng một ý">
                          <textarea
                            value={form.weaknesses}
                            onChange={(event) => setForm((current) => current ? { ...current, weaknesses: event.target.value } : current)}
                            className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                          />
                        </Field>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="border-t border-white/80 bg-white/90 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">Bố cục cố định theo kiểu phần mềm quản trị: danh sách bên trái, chi tiết bên phải, cuộn nội bộ trong panel.</p>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-slate-500">
                Chưa có học sinh nào để hiển thị.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white px-4 py-3 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
          <div className="text-xl font-semibold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border px-2 py-2",
      active ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
    )}>
      <div className={cn("text-[10px] uppercase tracking-wide", active ? "text-slate-400" : "text-slate-500")}>{label}</div>
      <div className={cn("mt-1 text-sm font-semibold", active ? "text-white" : "text-slate-900")}>{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InfoGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
          <div className="mt-2 text-sm font-medium text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
