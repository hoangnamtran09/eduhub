"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, School } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClassRecord {
  id: string;
  name: string;
  gradeLevel: number | null;
  studentCount: number;
  teacherName: string | null;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((res) => res.json())
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách lớp học</p>
        </div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm lớp học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="size-7 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <School className="size-10 mx-auto mb-3 opacity-50" />
          <p>{search ? "Không tìm thấy lớp học nào" : "Chưa có lớp học nào"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên lớp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Khối</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Sĩ số</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Giáo viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.gradeLevel ? `Lớp ${c.gradeLevel}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.studentCount}</td>
                  <td className="px-4 py-3 text-gray-600">{c.teacherName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
