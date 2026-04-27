"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TeacherStudent = {
  id: string;
  email: string;
  fullName: string | null;
  gradeLevel: number | null;
  totalStudySeconds?: number;
  parentId?: string | null;
  parent?: { id: string; email: string; fullName: string | null } | null;
  profile?: {
    goals?: string[];
    strengths?: string[];
    weaknesses?: string[];
    streakDays?: number;
    lastActive?: string | null;
  } | null;
};

type ParentOption = {
  id: string;
  email: string;
  fullName: string | null;
};

const emptyForm = {
  email: "",
  password: "",
  fullName: "",
  gradeLevel: "",
  parentId: "",
  createParent: false,
  parentEmail: "",
  parentPassword: "",
  parentFullName: "",
  goals: "",
  strengths: "",
  weaknesses: "",
};

function listFromText(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function formatHours(seconds = 0) {
  return `${(seconds / 3600).toFixed(1)} giờ`;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/teacher/students");
      const data = await response.json();
      setStudents(Array.isArray(data?.students) ? data.students : []);
      setParents(Array.isArray(data?.parents) ? data.parents : []);
    } catch (error) {
      console.error("Failed to load teacher students", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students;
    return students.filter((student) =>
      [student.fullName, student.email, student.parent?.email, student.parent?.fullName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [query, students]);

  const handleCreate = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          gradeLevel: Number(form.gradeLevel),
          parentId: form.createParent ? null : form.parentId || null,
          createParent: form.createParent,
          parentEmail: form.parentEmail,
          parentPassword: form.parentPassword,
          parentFullName: form.parentFullName,
          goals: listFromText(form.goals),
          strengths: listFromText(form.strengths),
          weaknesses: listFromText(form.weaknesses),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Không thể tạo học sinh.");
      }

      setForm(emptyForm);
      setShowForm(false);
      await loadStudents();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tạo học sinh.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student: TeacherStudent) => {
    if (!window.confirm(`Xóa học sinh ${student.fullName || student.email}?`)) return;

    const response = await fetch(`/api/teacher/students?id=${student.id}`, { method: "DELETE" });
    if (response.ok) {
      await loadStudents();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Teacher</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Học sinh của tôi</h1>
            <p className="mt-2 text-sm text-gray-600">Tạo học sinh, theo dõi tiến độ và mở báo cáo học tập từng em.</p>
          </div>
          <Button onClick={() => setShowForm((current) => !current)} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm học sinh
          </Button>
        </header>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Thêm học sinh mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <Input placeholder="Email học sinh" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Input type="number" min={1} max={12} placeholder="Lớp" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Textarea placeholder="Mục tiêu - mỗi dòng một ý" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
                <Textarea placeholder="Điểm mạnh - mỗi dòng một ý" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
                <Textarea placeholder="Điểm yếu - mỗi dòng một ý" value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.createParent} onChange={(e) => setForm({ ...form, createParent: e.target.checked, parentId: "" })} />
                Tạo tài khoản phụ huynh mới
              </label>

              {form.createParent ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Input placeholder="Tên phụ huynh" value={form.parentFullName} onChange={(e) => setForm({ ...form, parentFullName: e.target.value })} />
                  <Input placeholder="Email phụ huynh" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
                  <Input type="password" placeholder="Mật khẩu phụ huynh" value={form.parentPassword} onChange={(e) => setForm({ ...form, parentPassword: e.target.value })} />
                </div>
              ) : (
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm">
                  <option value="">Không gắn phụ huynh</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>{parent.fullName || parent.email}</option>
                  ))}
                </select>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
                <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo học sinh"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input className="pl-10" placeholder="Tìm theo tên, email học sinh hoặc phụ huynh" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : filteredStudents.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500"><Users className="mb-3 h-10 w-10" />Chưa có học sinh nào.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{student.fullName || student.email}</CardTitle>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-gray-500">Lớp</div><div className="font-semibold">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : "Chưa có"}</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-gray-500">Thời gian học</div><div className="font-semibold">{formatHours(student.totalStudySeconds)}</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-gray-500">Chuỗi học</div><div className="font-semibold">{student.profile?.streakDays || 0} ngày</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-gray-500">Phụ huynh</div><div className="font-semibold truncate">{student.parent?.fullName || student.parent?.email || "Chưa gắn"}</div></div>
                  </div>
                  {student.profile?.weaknesses?.length ? (
                    <div className="text-sm text-gray-600">Cần củng cố: {student.profile.weaknesses.slice(0, 3).join(", ")}</div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/teacher/students/${student.id}/report`}><Eye className="h-4 w-4" />Xem báo cáo</Link>
                    </Button>
                    <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(student)}>
                      <Trash2 className="h-4 w-4" />Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
