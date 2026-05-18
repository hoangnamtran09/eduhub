"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ParentRecord {
  id: string;
  fullName: string | null;
  email: string;
  childName: string | null;
  createdAt: string;
}

export default function AdminParentsPage() {
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/parents")
      .then((res) => res.json())
      .then(setParents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = parents.filter(
    (p) =>
      (p.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phụ huynh</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách tài khoản phụ huynh</p>
        </div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm phụ huynh..."
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
          <Heart className="size-10 mx-auto mb-3 opacity-50" />
          <p>{search ? "Không tìm thấy phụ huynh nào" : "Chưa có phụ huynh nào"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Họ tên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Học sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{p.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3 text-gray-600">{p.childName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
