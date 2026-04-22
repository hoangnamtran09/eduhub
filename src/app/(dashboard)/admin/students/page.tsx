"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Loader2,
  PencilLine,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createForm,
  formatStudyTime,
  toListValue,
  type StudentForm,
  type StudentRecord,
} from "@/app/(dashboard)/admin/students/helpers";

const gradeTabs = ["all", "none", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
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
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openEditModal = (student: StudentRecord) => {
    setEditingStudentId(student.id);
    setForm(createForm(student));
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingStudentId(null);
    setForm(null);
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
      setEditingStudentId(null);
      setForm(null);
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

      setStudents((current) => current.filter((student) => student.id !== studentId));
      if (editingStudentId === studentId) {
        setEditingStudentId(null);
        setForm(null);
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
    <>
      <div className="min-h-[calc(100vh-48px)] rounded-[36px] border border-white/80 bg-paper-100/70 text-slate-900 shadow-panel backdrop-blur-sm">
        <header className="border-b border-white/80 bg-white/88 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              LMS Registry
            </div>
            <h1 className="font-serif text-[30px] font-semibold tracking-tight text-slate-900">Quản lý học sinh</h1>
          </div>
        </header>

        <section className="border-b border-white/80 bg-white/88 px-6 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col gap-3 xl:max-w-2xl xl:flex-row xl:items-center">
              <div className="relative w-full xl:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo tên hoặc email"
                  className="h-11 rounded-2xl border-white bg-white pl-11 text-slate-900 placeholder:text-slate-400 shadow-soft"
                />
              </div>
              <div className="w-full xl:w-56">
                <select
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white bg-white px-4 text-sm text-slate-900 shadow-soft outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                >
                  {gradeTabs.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "all" ? "Tất cả khối lớp" : grade === "none" ? "Chưa phân lớp" : `Lớp ${grade}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Bộ lọc hiện tại: <span className="font-medium text-slate-700">{selectedGrade === "all" ? "Tất cả khối lớp" : selectedGrade === "none" ? "Chưa phân lớp" : `Lớp ${selectedGrade}`}</span>
            </div>
          </div>
        </section>

        <section className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h2>
              <p className="text-xs text-slate-500">{filteredStudents.length} bản ghi phù hợp</p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const totalStudySeconds = student.studySessions.reduce((sum, session) => sum + (session.durationSec || 0), 0);

              return (
                <Card key={student.id} className="border-white/90 bg-white shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {student.fullName || "Chưa cập nhật tên"}
                          </h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa phân lớp"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">{student.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <MiniBadge label="Kim cương" value={student.diamonds} />
                          <MiniBadge label="Chuỗi học" value={student.profile?.streakDays || 0} />
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Thời gian học đã ghi nhận: <span className="font-semibold text-slate-900">{formatStudyTime(totalStudySeconds)}</span>
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          Tạo ngày {new Date(student.createdAt).toLocaleDateString("vi-VN")}
                          {student.profile?.lastActive
                            ? ` • Hoạt động gần nhất ${new Date(student.profile.lastActive).toLocaleDateString("vi-VN")}`
                            : " • Chưa có hoạt động gần đây"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openEditModal(student)}
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleDelete(student.id)}
                          disabled={deletingId === student.id}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          {deletingId === student.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!filteredStudents.length && (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-soft">
                Không có học sinh nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </section>
      </div>

      {editingStudentId && form && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-full max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chỉnh sửa học sinh</div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{form.fullName || form.email}</h2>
                <p className="mt-1 text-sm text-slate-500">Cập nhật hồ sơ, mục tiêu học tập và chỉ số quản trị.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeEditModal} disabled={saving}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="border-slate-200 bg-white shadow-none">
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

                <Card className="border-slate-200 bg-white shadow-none">
                  <CardContent className="space-y-4 p-5">
                    <SectionTitle icon={BookOpen} title="Mục tiêu và năng lực" />
                    <Field label="Mục tiêu - mỗi dòng một ý">
                      <textarea
                        value={form.goals}
                        onChange={(event) => setForm((current) => current ? { ...current, goals: event.target.value } : current)}
                        className="min-h-[128px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                      />
                    </Field>
                    <Field label="Điểm mạnh - mỗi dòng một ý">
                      <textarea
                        value={form.strengths}
                        onChange={(event) => setForm((current) => current ? { ...current, strengths: event.target.value } : current)}
                        className="min-h-[128px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                      />
                    </Field>
                    <Field label="Cần cải thiện - mỗi dòng một ý">
                      <textarea
                        value={form.weaknesses}
                        onChange={(event) => setForm((current) => current ? { ...current, weaknesses: event.target.value } : current)}
                        className="min-h-[128px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-sm text-slate-500">Popup tập trung vào chỉnh sửa, còn danh sách chính giữ gọn để quản trị nhanh hơn.</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={closeEditModal} disabled={saving}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MiniBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
      <span className="font-semibold text-slate-900">{value}</span> {label}
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
