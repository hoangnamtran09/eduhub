"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { User, Bell, Shield, Palette, Save, Loader2, Lock } from "lucide-react";

const tabs = [
  { id: "profile", label: "Hồ sơ", icon: User },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
  { id: "appearance", label: "Giao diện", icon: Palette },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({ fullName: "", gradeLevel: "" });
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      fullName: user.fullName || "",
      gradeLevel: user.gradeLevel ? String(user.gradeLevel) : "",
    });
  }, [user]);

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || isSavingProfile) return;

    setProfileStatus(null);
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          gradeLevel: profileForm.gradeLevel ? Number(profileForm.gradeLevel) : null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể lưu hồ sơ");
      }

      setUser(data.user);
      setProfileStatus({ type: "success", message: "Đã lưu thay đổi hồ sơ" });
    } catch (error) {
      setProfileStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể lưu hồ sơ",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChangingPassword) return;

    setPasswordStatus(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "error", message: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể đổi mật khẩu");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ type: "success", message: data.message || "Đã đổi mật khẩu" });
    } catch (error) {
      setPasswordStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể đổi mật khẩu",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 mt-1">Quản lý tài khoản và tùy chọn</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSaveProfile}>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                  <div>
                    <Button type="button" variant="outline" disabled>Đổi ảnh đại diện</Button>
                    <p className="mt-1 text-xs text-slate-500">Tính năng đổi ảnh sẽ được bổ sung sau.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Họ và tên"
                    value={profileForm.fullName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
                    required
                  />
                  <Input label="Email" type="email" value={user?.email || ""} disabled />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Lớp</label>
                    <select
                      className="w-full h-10 px-3 rounded-sm border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={profileForm.gradeLevel}
                      onChange={(event) => setProfileForm((current) => ({ ...current, gradeLevel: event.target.value }))}
                    >
                      <option value="">Chưa chọn lớp</option>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
                        <option key={grade} value={grade}>Lớp {grade}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {profileStatus && (
                  <p className={profileStatus.type === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
                    {profileStatus.message}
                  </p>
                )}
                <Button className="gap-2" disabled={isSavingProfile || !profileForm.fullName.trim()}>
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Hệ thống thông báo đang được phát triển. Các tùy chọn bên dưới hiện được khóa để tránh hiểu nhầm.
                </div>
                {["Nhắc nhở học tập hàng ngày", "Thông báo khi có bài mới", "Email báo cáo tuần"].map((item) => (
                  <div key={item} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-slate-500">{item}</span>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Sắp ra mắt</span>
                    </div>
                    <label className="relative inline-flex cursor-not-allowed items-center opacity-60">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-['']"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>Quản lý mật khẩu và bảo mật</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleChangePassword}>
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  required
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  helperText="Tối thiểu 8 ký tự"
                  required
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  required
                />
                {passwordStatus && (
                  <p className={passwordStatus.type === "success" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
                    {passwordStatus.message}
                  </p>
                )}
                <Button className="gap-2" disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Giao diện</CardTitle>
                <CardDescription>Tùy chỉnh giao diện ứng dụng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Chế độ</label>
                  <div className="flex gap-4">
                    {["Sáng", "Tối", "Tự động"].map((mode) => (
                      <button
                        key={mode}
                        className={`px-4 py-2 rounded-lg border ${
                          mode === "Sáng"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
