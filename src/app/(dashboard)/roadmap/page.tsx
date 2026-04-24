"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Clock3, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoadmapSignal = {
  source: "QUIZ" | "EXERCISE" | "PROFILE" | "PROGRESS";
  weight: number;
  reason: string;
};

type RoadmapStep = {
  id: string;
  title: string;
  description: string;
  focusTopic: string;
  actionType: "review" | "practice" | "quiz" | "study";
  priority: number;
  estimatedMinutes: number;
};

type FocusArea = {
  id: string;
  topic: string;
  severity: "high" | "medium" | "low";
  score: number;
  lessonId?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  reason: string;
  recommendedAction: string;
  signalBreakdown?: RoadmapSignal[];
};

type RoadmapPayload = {
  generatedAt: string;
  summary: {
    totalStudySeconds: number;
    averageQuizScore: number;
    lowScoreCount: number;
    practiceCount: number;
    streakDays: number;
  };
  roadmap: RoadmapStep[];
  focusAreas: FocusArea[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function actionTypeLabel(actionType: RoadmapStep["actionType"]) {
  switch (actionType) {
    case "review":
      return "Ôn lại";
    case "practice":
      return "Luyện tập";
    case "quiz":
      return "Tự kiểm tra";
    default:
      return "Học tập";
  }
}

function severityClass(severity: FocusArea["severity"]) {
  if (severity === "high") return "bg-rose-100 text-rose-700 border-rose-200";
  if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function signalLabel(source: RoadmapSignal["source"]) {
  if (source === "QUIZ") return "Quiz";
  if (source === "EXERCISE") return "Bài tập AI";
  if (source === "PROGRESS") return "Tiến độ học";
  return "Hồ sơ cá nhân";
}

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/roadmap");
        if (!response.ok) {
          throw new Error("Failed to load roadmap");
        }

        const payload = await response.json();
        setData(payload);
      } catch (error) {
        console.error("Failed to load roadmap page:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalMinutes = useMemo(
    () => (data?.roadmap || []).reduce((sum, item) => sum + item.estimatedMinutes, 0),
    [data],
  );
  const primaryLessonHref = useMemo(() => {
    const target = data?.focusAreas.find((item) => item.lessonId && item.subjectId);
    if (!target?.lessonId || !target.subjectId) return "/courses";
    return `/courses/${target.subjectId}/${target.lessonId}`;
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span>Đang tạo roadmap cá nhân hóa...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-8 text-sm text-slate-500">
        Không tải được roadmap học tập.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Adaptive Roadmap
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">Lộ trình học tập cá nhân hóa</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Roadmap này được xếp tự động từ những chủ đề yếu, các bài làm chưa vững và tiến độ học tập hiện tại để giúp bạn biết nên học gì tiếp theo.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mistakes">
              <Button variant="outline" className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Xem phân tích điểm yếu
              </Button>
            </Link>
            <Link href={primaryLessonHref}>
              <Button className="h-11 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                <BookOpen className="mr-2 h-4 w-4" />
                {primaryLessonHref === "/courses" ? "Bắt đầu học" : "Mở bài học ưu tiên"}
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#082f49_0%,#0f172a_100%)] p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Tổng quan</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/65">Tổng thời lượng đề xuất</p>
              <p className="mt-1 text-2xl font-semibold text-white">{totalMinutes} phút</p>
              <p className="mt-1 text-xs text-white/55">{data.roadmap.length} bước hành động được sắp theo thứ tự ưu tiên</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Vùng tập trung</p>
                <p className="mt-1 text-xl font-semibold">{data.focusAreas.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/55">Chuỗi học</p>
                <p className="mt-1 text-xl font-semibold">{data.summary.streakDays}</p>
              </div>
            </div>
            <p className="text-xs text-white/45">Cập nhật lúc {formatDate(data.generatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bước ưu tiên</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.roadmap.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Điểm quiz TB</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.averageQuizScore}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Lượt luyện tập</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.practiceCount}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Thứ tự hành động</h2>
            <p className="text-sm text-slate-500">Đi từ ôn lại nền tảng, luyện tập có hướng dẫn đến tự kiểm tra nhanh.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            Auto-generated
          </div>
        </div>
        <div className="space-y-3">
          {data.roadmap.length ? data.roadmap.map((item) => (
            <div key={item.id} className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5 md:grid-cols-[72px,minmax(0,1fr),160px] md:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white">
                {item.priority}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                    {actionTypeLabel(item.actionType)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Tập trung: {item.focusTopic}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  {item.estimatedMinutes} phút
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
              Chưa có dữ liệu để tạo roadmap cá nhân hóa.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Các vùng cần tập trung</h2>
          <p className="text-sm text-slate-500">Danh sách này giúp bạn hiểu vì sao roadmap được ưu tiên theo thứ tự hiện tại.</p>
        </div>
        <div className="space-y-3">
          {data.focusAreas.length ? data.focusAreas.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{item.topic}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${severityClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                  <p className="text-xs text-slate-500">Mức độ ưu tiên</p>
                  <p className="text-xl font-semibold text-slate-900">{item.score}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),auto]">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">Hành động đề xuất</p>
                  <p className="mt-1 text-sm text-slate-700">{item.recommendedAction}</p>
                </div>
                <Link href={item.lessonId && item.subjectName ? `/courses/${encodeURIComponent(item.subjectName)}/${item.lessonId}` : "/courses"}>
                  <Button variant="outline" className="h-full min-h-14 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {item.lessonId ? "Mở bài học liên quan" : "Xem khóa học"}
                  </Button>
                </Link>
              </div>
              {!!item.signalBreakdown?.length && (
                <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tín hiệu giải thích</p>
                    <p className="text-xs text-slate-400">Top {item.signalBreakdown.length} nguồn ưu tiên</p>
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
              Chưa có vùng tập trung nào được xác định.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(6,78,99,0.96)_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Start Now</p>
            <h3 className="mt-2 text-2xl font-semibold">Biến roadmap thành một phiên học thực tế</h3>
            <p className="mt-2 max-w-2xl text-sm text-white/70">Bắt đầu với bước đầu tiên, sau đó quay lại để kiểm tra xem điểm yếu đã giảm chưa.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryLessonHref}>
              <Button className="h-11 rounded-2xl bg-white px-5 text-slate-900 hover:bg-slate-100">
                <Target className="mr-2 h-4 w-4" />
                {primaryLessonHref === "/courses" ? "Bắt đầu học" : "Đi tới bài học ưu tiên"}
              </Button>
            </Link>
            <Link href="/mistakes">
              <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/5 px-5 text-white hover:bg-white/10">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xem lại dấu vết
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
