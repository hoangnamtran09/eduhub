"use client";

import { Shield, Library, Users, ClipboardList, NotebookPen, Heart, School } from "lucide-react";
import Link from "next/link";

const adminLinks = [
  { href: "/admin/students", label: "Quản lý học sinh", icon: Library, desc: "Xem và quản lý danh sách học sinh", color: "from-blue-500 to-blue-600" },
  { href: "/admin/teachers", label: "Quản lý giáo viên", icon: Users, desc: "Xem và quản lý danh sách giáo viên", color: "from-emerald-500 to-emerald-600" },
  { href: "/admin/subjects", label: "Quản lý môn học", icon: ClipboardList, desc: "Quản lý các môn học và khóa học", color: "from-violet-500 to-violet-600" },
  { href: "/admin/assignments", label: "Giao bài tập", icon: NotebookPen, desc: "Quản lý bài tập và giao bài", color: "from-orange-500 to-orange-600" },
  { href: "/admin/parents", label: "Quản lý phụ huynh", icon: Heart, desc: "Xem và quản lý danh sách phụ huynh", color: "from-rose-500 to-rose-600" },
  { href: "/admin/classes", label: "Quản lý lớp học", icon: School, desc: "Xem và quản lý danh sách lớp học", color: "from-cyan-500 to-cyan-600" },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className={`inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${link.color} text-white mb-4 shadow-sm`}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                {link.label}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
