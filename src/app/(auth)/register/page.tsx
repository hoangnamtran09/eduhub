"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, Check, UserCircle, Users } from "lucide-react";
import { UserRole } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gradeLevel: "6",
    password: "",
    confirmPassword: "",
  });

  const passwordRequirements = [
    { label: "Ít nhất 8 ký tự", met: formData.password.length >= 8 },
    { label: "Có chữ hoa", met: /[A-Z]/.test(formData.password) },
    { label: "Có chữ số", met: /\d/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!passwordRequirements.every((req) => req.met)) {
      toast.error("Mật khẩu chưa đủ mạnh");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          gradeLevel: Number(formData.gradeLevel),
          password: formData.password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      // Update auth store
      setUser(data.user);

      toast.success("Đăng ký thành công!");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                EduHub
              </h1>
              <p className="text-xs text-slate-500 font-medium">Học thông minh với AI</p>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 ring-1 ring-slate-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-slate-900">Tạo tài khoản mới</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Bắt đầu hành trình học tập cá nhân hóa của bạn
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("STUDENT")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedRole === "STUDENT"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                }`}
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-xs font-bold">Học sinh</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("PARENT")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedRole === "PARENT"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs font-bold">Phụ huynh</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Thông tin cá nhân</span>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Họ và tên"
                    className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email của bạn"
                    className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  required
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
                    <option key={grade} value={grade}>Lớp {grade}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="grid grid-cols-1 gap-1 px-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-[10px] font-medium">
                      <Check
                        className={`w-3 h-3 ${req.met ? "text-emerald-500" : "text-slate-300"}`}
                      />
                      <span className={req.met ? "text-emerald-600" : "text-slate-400"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200" isLoading={isLoading}>
                Đăng ký ngay
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-8 pt-2">
            <p className="text-sm text-slate-600 font-medium">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Terms */}
        <p className="mt-6 text-[11px] text-center text-slate-400 font-medium leading-relaxed">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link href="/terms" className="text-slate-600 hover:text-blue-600 underline underline-offset-2">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="text-slate-600 hover:text-blue-600 underline underline-offset-2">
            Chính sách bảo mật
          </Link>{" "}
          của EduHub.
        </p>
      </div>
    </div>
  );
}
