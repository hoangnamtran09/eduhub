"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TeacherStudent {
  id: string;
  fullName: string | null;
  email: string;
  gradeLevel: number | null;
}

interface TeacherRecord {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  studentCount: number;
  assignmentCount: number;
  students: TeacherStudent[];
}

interface TeacherForm {
  id: string;
  email: string;
  fullName: string;
  password: string;
}

function createForm(teacher: TeacherRecord): TeacherForm {
  return {
    id: teacher.id,
    email: teacher.email,
    fullName: teacher.fullName || "",
    password: "",
  };
}

function emptyCreateForm() {
  return { fullName: "", email: "", password: "" };
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormState, setCreateFormState] = useState(emptyCreateForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/teachers");
      if (!response.ok) throw new Error("Failed to load teachers");
      const data = await response.json();
      setTeachers(Array.isArray(data?.teachers) ? data.teachers : []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = query.trim()
    ? teachers.filter((t) => {
        const q = query.trim().toLowerCase();
        return (
          t.fullName?.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
        );
      })
    : teachers;

  const openEditModal = (teacher: TeacherRecord) => {
    setEditingTeacherId(teacher.id);
    setForm(createForm(teacher));
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingTeacherId(null);
    setForm(null);
  };

  const openCreateModal = () => {
    setCreateFormState(emptyCreateForm());
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;
    setShowCreateModal(false);
  };

  const handleCreate = async () => {
    if (!createFormState.fullName.trim() || !createFormState.email.trim() || !createFormState.password) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormState),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create teacher");
      }

      const data = await response.json();
      setTeachers((current) => [data.teacher, ...current]);
      setShowCreateModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to update teacher");

      const data = await response.json();
      setTeachers((current) =>
        current.map((t) => (t.id === data.teacher.id ? data.teacher : t))
      );
      setEditingTeacherId(null);
      setForm(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm("Xóa giáo viên này? Học sinh của giáo viên sẽ được bỏ liên kết.")) return;

    setDeletingId(teacherId);
    try {
      const response = await fetch(`/api/admin/teachers?id=${teacherId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete teacher");

      setTeachers((current) => current.filter((t) => t.id !== teacherId));
      if (editingTeacherId === teacherId) {
        setEditingTeacherId(null);
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
      <div className="flex min-h-[calc(100vh-48px)] items-center justify-center rounded-2xl border border-white/80 bg-white text-slate-600 shadow-panel">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-500" />
          <p>Đang tải dữ liệu giáo viên...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-48px)] rounded-[30px] border border-white/80 bg-paper-100/70 text-slate-900 shadow-panel">
        <header className="border-b border-white/80 bg-white px-5 py-4">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              LMS Registry
            </div>
            <h1 className="font-serif text-[26px] font-semibold tracking-tight text-slate-900">Quản lý giáo viên</h1>
          </div>
        </header>

        <section className="border-b border-white/80 bg-white px-5 py-3.5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
                className="h-10 rounded-xl border-white bg-white pl-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-soft"
              />
            </div>
            <Button type="button" onClick={openCreateModal} className="h-9 bg-slate-900 px-3.5 text-sm text-white hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" />
              Thêm giáo viên
            </Button>
          </div>
        </section>

        <section className="p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Danh sách giáo viên</h2>
            <p className="text-xs text-slate-500">{filteredTeachers.length} bản ghi</p>
          </div>

          <div className="space-y-2.5">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="border-white/90 bg-white shadow-soft">
                <CardContent className="p-3.5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {teacher.fullName || "Chưa cập nhật tên"}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{teacher.email}</p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                          <Users className="mr-1 inline h-3 w-3" />
                          <span className="font-semibold text-slate-900">{teacher.studentCount}</span> học sinh
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                          <BookOpen className="mr-1 inline h-3 w-3" />
                          <span className="font-semibold text-slate-900">{teacher.assignmentCount}</span> bài tập đã giao
                        </span>
                      </div>

                      {teacher.students.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {teacher.students.map((student) => (
                            <span
                              key={student.id}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                            >
                              {student.fullName || student.email}
                              {student.gradeLevel ? ` (L${student.gradeLevel})` : ""}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        Tạo ngày {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openEditModal(teacher)}
                        className="h-8 border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDelete(teacher.id)}
                        disabled={deletingId === teacher.id}
                        className="h-8 bg-slate-900 px-3 text-xs text-white hover:bg-slate-800"
                      >
                        {deletingId === teacher.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!filteredTeachers.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-soft">
                {query.trim() ? "Không có giáo viên nào phù hợp với tìm kiếm." : "Chưa có giáo viên nào. Nhấn \"Thêm giáo viên\" để tạo tài khoản đầu tiên."}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      {editingTeacherId && form && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6">
          <div className="mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chỉnh sửa giáo viên</div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{form.fullName || form.email}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeEditModal} disabled={saving}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Field label="Họ và tên">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((c) => c ? { ...c, fullName: e.target.value } : c)}
                  className="border-slate-200 bg-white text-slate-900"
                />
              </Field>
              <Field label="Email">
                <Input
                  value={form.email}
                  onChange={(e) => setForm((c) => c ? { ...c, email: e.target.value } : c)}
                  className="border-slate-200 bg-white text-slate-900"
                />
              </Field>
              <Field label="Mật khẩu mới (để trống nếu không đổi)">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((c) => c ? { ...c, password: e.target.value } : c)}
                  placeholder="Nhập mật khẩu mới"
                  className="border-slate-200 bg-white text-slate-900"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button type="button" variant="outline" onClick={closeEditModal} disabled={saving}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving || !form.fullName.trim()} className="bg-slate-900 text-white hover:bg-slate-800">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6">
          <div className="mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tạo tài khoản giáo viên</div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Thêm giáo viên mới</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeCreateModal} disabled={saving}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Field label="Họ và tên">
                <Input
                  value={createFormState.fullName}
                  onChange={(e) => setCreateFormState((c) => ({ ...c, fullName: e.target.value }))}
                  className="border-slate-200 bg-white text-slate-900"
                  required
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={createFormState.email}
                  onChange={(e) => setCreateFormState((c) => ({ ...c, email: e.target.value }))}
                  className="border-slate-200 bg-white text-slate-900"
                  required
                />
              </Field>
              <Field label="Mật khẩu">
                <Input
                  type="password"
                  value={createFormState.password}
                  onChange={(e) => setCreateFormState((c) => ({ ...c, password: e.target.value }))}
                  className="border-slate-200 bg-white text-slate-900"
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button type="button" variant="outline" onClick={closeCreateModal} disabled={saving}>Hủy</Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !createFormState.fullName.trim() || !createFormState.email.trim() || !createFormState.password}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Tạo giáo viên
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
