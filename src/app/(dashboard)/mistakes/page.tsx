"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, BrainCircuit, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type MistakeItem = {
  source: "QUIZ" | "EXERCISE" | "PROFILE";
  topic: string;
  note: string;
  score?: number | null;
  createdAt?: string | null;
};

type WeaknessSignal = {
  source: "QUIZ" | "EXERCISE" | "PROFILE" | "PROGRESS";
  weight: number;
  reason: string;
};

type WeaknessItem = {
  id: string;
  topic: string;
  confidence: "high" | "medium" | "low";
  severity: "high" | "medium" | "low";
  reason: string;
  evidenceCount: number;
  recommendedAction: string;
  score: number;
  lessonId?: string | null;
  subjectName?: string | null;
  signalBreakdown?: WeaknessSignal[];
};

type MistakesPayload = {
  generatedAt: string;
  summary: {
    totalStudySeconds: number;
    averageQuizScore: number;
    lowScoreCount: number;
    practiceCount: number;
    streakDays: number;
  };
  strengths: string[];
  weaknesses: WeaknessItem[];
  mistakes: MistakeItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có mốc thời gian";
  return new Date(value).toLocaleString("vi-VN");
}

function severityBadge(severity: WeaknessItem["severity"]) {
  if (severity === "high") return "bg-rose-100 text-rose-700 border-rose-200";
  if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function sourceLabel(source: MistakeItem["source"]) {
  if (source === "QUIZ") return "Quiz";
  if (source === "EXERCISE") return "Bài tập AI";
  return "Hồ sơ học sinh";
}

function signalLabel(source: WeaknessSignal["source"]) {
  if (source === "QUIZ") return "Quiz";
  if (source === "EXERCISE") return "Bài tập AI";
  if (source === "PROGRESS") return "Tiến độ học";
  return "Hồ sơ cá nhân";
}

export default function MistakesPage() {
  const [data, setData] = useState<MistakesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/weakness-analysis");
        if (!response.ok) {
          throw new Error("Failed to load weakness analysis");
        }

        const payload = await response.json();
        setData(payload);
      } catch (error) {
        console.error("Failed to load mistakes page:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const strongestNeed = useMemo(() => data?.weaknesses[0] ?? null, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span>Đang phân tích điểm yếu học tập...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-8 text-sm text-slate-500">
        Không tải được dữ liệu phân tích điểm yếu.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
            Weakness Analysis
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Bản đồ lỗi sai và vùng cần củng cố</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Hệ thống tổng hợp điểm quiz, bài tập AI, tiến độ học dở và hồ sơ cá nhân để xác định các chủ đề bạn đang cần ưu tiên ôn lại.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/roadmap">
              <Button className="h-11 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Xem roadmap cá nhân
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                <BookOpenCheck className="mr-2 h-4 w-4" />
                Quay lại khóa học
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#1f2937_0%,#111827_100%)] p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Snapshot phân tích</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/65">Vùng ưu tiên cao nhất</p>
              <p className="mt-1 text-2xl font-semibold text-white">{strongestNeed?.topic || "Chưa có"}</p>
              <p className="mt-1 text-xs text-white/55">{strongestNeed?.reason || "Dữ liệu sẽ xuất hiện khi có hoạt động học tập."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Mục lỗi sai</p>
                <p className="mt-1 text-xl font-semibold">{data.mistakes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Điểm quiz TB</p>
                <p className="mt-1 text-xl font-semibold">{data.summary.averageQuizScore}</p>
              </div>
            </div>
            <p className="text-xs text-white/45">Cập nhật lúc {formatDate(data.generatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Chủ đề yếu nổi bật</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.weaknesses.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bài cần xem lại</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.lowScoreCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Chuỗi học hiện tại</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.streakDays}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chủ đề cần tập trung</h2>
            <p className="text-sm text-slate-500">Các tín hiệu được xếp theo mức ưu tiên và số bằng chứng hệ thống đã quan sát.</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.weaknesses.length ? data.weaknesses.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{item.topic}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${severityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                  <p className="text-xs text-slate-500">Điểm rủi ro</p>
                  <p className="text-xl font-semibold text-slate-900">{item.score}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[140px,1fr]">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">Bằng chứng</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.evidenceCount} tín hiệu</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">Khuyến nghị</p>
                  <p className="mt-1 text-sm text-slate-700">{item.recommendedAction}</p>
                </div>
              </div>
              {!!item.signalBreakdown?.length && (
                <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vì sao hệ thống xếp ưu tiên</p>
                    <p className="text-xs text-slate-400">Top {item.signalBreakdown.length} tín hiệu mạnh nhất</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {item.signalBreakdown.map((signal, index) => (
                      <div key={`${item.id}-${signal.source}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {signalLabel(signal.source)}
                          </span>
                          <span className="text-xs font-medium text-slate-400">Trọng số {signal.weight}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{signal.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
              Chưa có đủ dữ liệu để xác định chủ đề yếu nổi bật.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dấu vết lỗi sai gần đây</h2>
            <p className="text-sm text-slate-500">Những lần làm chưa tốt hoặc chủ đề đã được đánh dấu trong hồ sơ học tập.</p>
          </div>
          <Link href="/roadmap" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">
            Mở roadmap <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.mistakes.length ? data.mistakes.map((item, index) => (
            <div key={`${item.topic}-${index}`} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-[140px,minmax(0,1fr),120px] md:items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                {sourceLabel(item.source)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.topic}</p>
                <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-xs text-slate-500">Điểm</p>
                <p className="text-sm font-semibold text-slate-900">{item.score ?? "--"}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
              Chưa có lỗi sai nổi bật nào được ghi nhận.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(16,58,74,0.94)_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Next Move</p>
            <h3 className="mt-2 text-2xl font-semibold">Chuyển các phát hiện này thành hành động học tập cụ thể</h3>
            <p className="mt-2 max-w-2xl text-sm text-white/70">Roadmap cá nhân hóa sẽ sắp xếp thứ tự ôn tập, luyện tập và tự kiểm tra theo đúng các vùng bạn đang yếu nhất.</p>
          </div>
          <Link href="/roadmap">
            <Button className="h-11 rounded-2xl bg-white px-5 text-slate-900 hover:bg-slate-100">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tạo lộ trình học
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
