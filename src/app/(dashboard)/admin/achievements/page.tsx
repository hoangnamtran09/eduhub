"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AchievementRecord = {
  id: string;
  title: string;
  description: string;
  icon: string;
  ruleType: string;
  ruleValue: number;
  isActive: boolean;
  createdAt: string;
};

type AchievementForm = {
  title: string;
  description: string;
  icon: string;
  ruleType: string;
  ruleValue: string;
};

const ruleOptions = [
  { value: "streak_days", label: "Chuỗi ngày học", hint: "Mở khóa khi đạt số ngày học liên tiếp" },
  { value: "avg_quiz_score", label: "Điểm quiz trung bình", hint: "Mở khóa khi điểm trung bình >= ngưỡng" },
  { value: "completed_exercises", label: "Bài tập AI đạt", hint: "Mở khóa theo số bài tập AI đạt yêu cầu" },
  { value: "total_study_hours", label: "Tổng giờ học", hint: "Mở khóa theo tổng số giờ học tích lũy" },
  { value: "weekly_study_hours", label: "Giờ học trong tuần", hint: "Mở khóa theo số giờ học trong 7 ngày gần nhất" },
  { value: "diamonds", label: "Kim cương", hint: "Mở khóa khi tích lũy đủ kim cương" },
];

const initialForm: AchievementForm = {
  title: "",
  description: "",
  icon: "🏆",
  ruleType: "streak_days",
  ruleValue: "7",
};

function getRuleLabel(ruleType: string) {
  return ruleOptions.find((option) => option.value === ruleType)?.label || ruleType;
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AchievementForm>(initialForm);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/achievements");
      if (!response.ok) {
        throw new Error("Failed to load achievements");
      }

      const data = await response.json();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const selectedRule = useMemo(
    () => ruleOptions.find((option) => option.value === form.ruleType) || ruleOptions[0],
    [form.ruleType],
  );

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.ruleValue.trim()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          icon: form.icon,
          ruleType: form.ruleType,
          ruleValue: Number(form.ruleValue),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create achievement");
      }

      const created = await response.json();
      setAchievements((current) => [created, ...current]);
      setForm(initialForm);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-48px)] items-center justify-center rounded-[32px] border border-white/80 bg-white/90 text-slate-600 shadow-panel">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-500" />
          <p>Đang tải danh sách thành tựu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)] rounded-[36px] border border-white/80 bg-paper-100/70 text-slate-900 shadow-panel backdrop-blur-sm">
      <header className="border-b border-white/80 bg-white/88 px-6 py-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Achievement Builder
          </div>
          <h1 className="font-serif text-[30px] font-semibold tracking-tight text-slate-900">Quản lý thành tựu</h1>
          <p className="mt-1 text-sm text-slate-500">Admin có thể tạo thêm các cột mốc mở khóa hiển thị trong trang tiến độ và dashboard.</p>
        </div>
      </header>

      <section className="grid gap-6 p-6 xl:grid-cols-[420px,minmax(0,1fr)]">
        <Card className="border-white/90 bg-white shadow-soft">
          <CardContent className="space-y-5 p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tạo thành tựu mới</h2>
              <p className="mt-1 text-sm text-slate-500">Thiết lập icon, điều kiện mở khóa và nội dung hiển thị.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tên thành tựu</label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ví dụ: Chuyên gia kiên trì"
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Ví dụ: Học liên tục 14 ngày không bỏ lỡ"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Icon</label>
                <Input
                  value={form.icon}
                  onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                  placeholder="🏆"
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ngưỡng mở khóa</label>
                <Input
                  type="number"
                  min="1"
                  value={form.ruleValue}
                  onChange={(event) => setForm((current) => ({ ...current, ruleValue: event.target.value }))}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Điều kiện</label>
              <select
                value={form.ruleType}
                onChange={(event) => setForm((current) => ({ ...current, ruleType: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/20"
              >
                {ruleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">{selectedRule.hint}</p>
            </div>

            <Button type="button" onClick={handleCreate} disabled={saving} className="h-11 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Tạo thành tựu
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Danh sách thành tựu</h2>
              <p className="text-sm text-slate-500">{achievements.length} cấu hình đang hoạt động trong hệ thống</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="border-white/90 bg-white shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                      {achievement.icon || "🏆"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{achievement.title}</h3>
                        {achievement.isActive && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Active</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{achievement.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                          {getRuleLabel(achievement.ruleType)}
                        </span>
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                          Mốc {achievement.ruleValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!achievements.length && (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">
              <Sparkles className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              Chưa có thành tựu nào trong hệ thống. Tạo thành tựu đầu tiên ở khối bên trái.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
