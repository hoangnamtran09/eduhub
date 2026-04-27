"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, Users, UserRound, BookOpen, ArrowRight } from "lucide-react";

const LOGIN_ROLES = [
  {
    label: "Admin",
    description: "Quản trị hệ thống, học sinh, giáo viên và nội dung.",
    href: "/login/admin",
    icon: ShieldCheck,
  },
  {
    label: "Học Sinh",
    description: "Học bài, làm bài tập và theo dõi tiến độ cá nhân.",
    href: "/login/student",
    icon: GraduationCap,
  },
  {
    label: "Phụ Huynh",
    description: "Theo dõi quá trình học tập và kết quả của con.",
    href: "/login/parent",
    icon: Users,
  },
  {
    label: "Giáo viên",
    description: "Quản lý lớp học, giao bài và theo dõi học sinh.",
    href: "/login/teacher",
    icon: BookOpen,
  },
] as const;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRoleChooser />
    </Suspense>
  );
}

function LoginRoleChooser() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;

  const getHref = (href: string) => {
    if (!safeCallbackUrl) return href;
    return `${href}?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
  };

  return (
    <main className="min-h-screen bg-paper-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md mb-6">
            <UserRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 mb-3">
            Bạn muốn đăng nhập với vai trò nào?
          </h1>
          <p className="text-ink-500 text-lg">
            Chọn đúng vai trò để tiếp tục vào khu vực phù hợp.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {LOGIN_ROLES.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={getHref(item.href)} className="group h-full">
                <Card className="h-full border-ink-200/70 hover:border-brand-300 hover:shadow-xl transition-all duration-200 bg-white/90">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-ink-900 mb-2">{item.label}</h2>
                    <p className="text-ink-500 text-sm leading-6 flex-1">{item.description}</p>
                    <div className="mt-6 flex items-center text-brand-600 font-semibold">
                      Đăng nhập
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
