"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, Play, RefreshCcw, TrendingUp, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

type MistakeItem = {
  source: "QUIZ" | "EXERCISE" | "PROFILE";
  topic: string;
  note: string;
  score?: number | null;
  createdAt?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  status?: string | null;
  aiFeedback?: string | null;
  reviewExercises?: unknown;
  weaknessDbId?: string | null;
};

type WeaknessSignal = {
  source: "QUIZ" | "EXERCISE" | "PROFILE" | "PROGRESS";
  weight: number;
  reason: string;
};

type WeaknessItem = {
  id: string;
  weaknessDbId?: string | null;
  topic: string;
  confidence: "high" | "medium" | "low";
  severity: "high" | "medium" | "low";
  reason: string;
  evidenceCount: number;
  recommendedAction: string;
  score: number;
  status?: "ACTIVE" | "REMEDIATED";
  aiFeedback?: string | null;
  reviewExercises?: unknown;
  lessonId?: string | null;
  lessonTitle?: string | null;
  subjectName?: string | null;
  initialScore?: number | null;
  bestScore?: number | null;
  remediationCount?: number;
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

type RemediationQuestion = {
  id: string;
  question: string;
  options: string[];
  hint: string;
};

type RemediationQuiz = {
  attemptId: string;
  weaknessId: string;
  topic: string;
  lessonTitle: string | null;
  questions: RemediationQuestion[];
};

type QuizResult = {
  questionId: string;
  question: string;
  options: string[];
  userAnswer: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
};

type RemediationResult = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  newStatus: string;
  initialScore: number;
  bestScore: number;
  results: QuizResult[];
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

function getReviewExercises(value: unknown): Array<{ title: string; question: string; options: string[]; correctAnswer?: string; hint?: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title : "Bài ôn tập",
      question: typeof item?.question === "string" ? item.question : "Ôn lại một ví dụ tương tự trong bài học.",
      options: Array.isArray(item?.options) ? item.options.filter((option: unknown) => typeof option === "string").slice(0, 4) : [],
      correctAnswer: typeof item?.correctAnswer === "string" ? item.correctAnswer : undefined,
      hint: typeof item?.hint === "string" ? item.hint : undefined,
    }))
    .slice(0, 3);
}

function statusLabel(status?: string | null) {
  return status === "REMEDIATED" ? "Đã khắc phục" : "Đang cần ôn";
}

function statusClass(status?: string | null) {
  return status === "REMEDIATED"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

export default function MistakesPage() {
  const [data, setData] = useState<MistakesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<RemediationQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizResult, setQuizResult] = useState<RemediationResult | null>(null);
  const [startingRemediation, setStartingRemediation] = useState<string | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [expandedWeakness, setExpandedWeakness] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/weakness-analysis");
      if (!response.ok) throw new Error("Failed to load weakness analysis");
      setData(await response.json());
    } catch (error) {
      console.error("Failed to load mistakes page:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const strongestNeed = useMemo(() => data?.weaknesses[0] ?? null, [data]);

  const remediationStats = useMemo(() => {
    if (!data) return { active: 0, remediated: 0, totalAttempts: 0 };
    const active = data.weaknesses.filter((w) => w.status !== "REMEDIATED").length;
    const remediated = data.weaknesses.filter((w) => w.status === "REMEDIATED").length;
    const totalAttempts = data.weaknesses.reduce((sum, w) => sum + (w.remediationCount || 0), 0);
    return { active, remediated, totalAttempts };
  }, [data]);

  const handleStartRemediation = async (weaknessDbId: string) => {
    setStartingRemediation(weaknessDbId);
    try {
      const res = await fetch(`/api/weakness-signals/${weaknessDbId}/start-remediation`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start");
      const quiz: RemediationQuiz = await res.json();
      setActiveQuiz(quiz);
      setQuizAnswers(new Array(quiz.questions.length).fill(null));
      setQuizResult(null);
    } catch (error) {
      console.error("Start remediation error:", error);
    } finally {
      setStartingRemediation(null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submittingQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/weakness-signals/${activeQuiz.weaknessId}/submit-remediation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeQuiz.attemptId, answers: quizAnswers }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const result: RemediationResult = await res.json();
      setQuizResult(result);
      loadData();
    } catch (error) {
      console.error("Submit remediation error:", error);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return <LoadingState message="Đang phân tích điểm yếu học tập..." />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={BrainCircuit}
        title="Không tải được dữ liệu"
        description="Không tải được dữ liệu phân tích điểm yếu. Vui lòng thử lại sau."
        action={<Link href="/courses"><Button>Bắt đầu học</Button></Link>}
      />
    );
  }

  if (activeQuiz && !quizResult) {
    const allAnswered = quizAnswers.every((a) => a !== null);
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">Bài ôn tập</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{activeQuiz.topic}</h2>
              {activeQuiz.lessonTitle && <p className="mt-1 text-sm text-slate-500">{activeQuiz.lessonTitle}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setActiveQuiz(null); setQuizResult(null); }}>
              Hủy
            </Button>
          </div>
        </div>

        {activeQuiz.questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Câu {qIdx + 1}/{activeQuiz.questions.length}</p>
            <p className="mt-2 text-base text-slate-900">{q.question}</p>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={`${q.id}-${optIdx}`}
                  onClick={() => setQuizAnswers((prev) => { const n = [...prev]; n[qIdx] = optIdx; return n; })}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition",
                    quizAnswers[qIdx] === optIdx
                      ? "border-violet-400 bg-violet-50 font-semibold text-violet-900"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                  )}
                >
                  {String.fromCharCode(65 + optIdx)}. {opt}
                </button>
              ))}
            </div>
            {q.hint && <p className="mt-3 text-xs text-slate-400">Gợi ý: {q.hint}</p>}
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={handleSubmitQuiz} disabled={!allAnswered || submittingQuiz} className="h-11 rounded-2xl px-8">
            {submittingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Nộp bài ôn
          </Button>
        </div>
      </div>
    );
  }

  if (activeQuiz && quizResult) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div className={cn(
          "rounded-[28px] border p-6 shadow-sm text-center",
          quizResult.passed ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50",
        )}>
          {quizResult.passed
            ? <Trophy className="mx-auto h-12 w-12 text-emerald-500" />
            : <RefreshCcw className="mx-auto h-12 w-12 text-orange-500" />}
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {quizResult.passed ? "Chúc mừng! Đã khắc phục!" : "Cần ôn thêm"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Điểm: <strong>{quizResult.score}%</strong> ({quizResult.correct}/{quizResult.total} đúng)
            {quizResult.passed ? " — Chủ đề đã được đánh dấu REMEDIATED." : " — Cần đạt 70% để khắc phục."}
          </p>
          {quizResult.bestScore > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
              <TrendingUp className="h-3.5 w-3.5" />
              Điểm ban đầu: {quizResult.initialScore}% → Tốt nhất: {quizResult.bestScore}%
            </div>
          )}
        </div>

        {quizResult.results.map((r, idx) => (
          <div key={r.questionId} className={cn(
            "rounded-[24px] border p-5",
            r.isCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50",
          )}>
            <div className="flex items-start gap-3">
              {r.isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 text-rose-500" />}
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Câu {idx + 1}</p>
                <p className="mt-1 text-sm text-slate-900">{r.question}</p>
                <div className="mt-3 grid gap-1">
                  {r.options.map((opt, oi) => (
                    <div key={oi} className={cn(
                      "rounded-lg px-3 py-2 text-xs",
                      oi === r.correctIndex ? "bg-emerald-100 font-semibold text-emerald-800" :
                      oi === r.userAnswer && !r.isCorrect ? "bg-rose-100 text-rose-700 line-through" :
                      "bg-slate-100 text-slate-600",
                    )}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
                </div>
                {r.explanation && <p className="mt-2 text-xs text-slate-500">{r.explanation}</p>}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 justify-center">
          {!quizResult.passed && (
            <Button onClick={() => handleStartRemediation(activeQuiz.weaknessId)} className="h-11 rounded-2xl px-6">
              <RefreshCcw className="mr-2 h-4 w-4" /> Ôn lại lần nữa
            </Button>
          )}
          <Button variant="outline" onClick={() => { setActiveQuiz(null); setQuizResult(null); }} className="h-11 rounded-2xl px-6">
            Quay lại phân tích
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),360px]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-sm">
          <PageHeader
            label="Phân tích điểm yếu"
            labelVariant="rose"
            title="Bản đồ lỗi sai và vùng cần củng cố"
            description="Hệ thống tổng hợp điểm quiz, bài tập AI, tiến độ học dở và hồ sơ cá nhân để xác định các chủ đề bạn đang cần ưu tiên ôn lại."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/roadmap">
              <Button className="h-11 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Xem lộ trình cá nhân
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

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Chủ đề yếu</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.weaknesses.length}</p>
        </div>
        <div className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-5 shadow-sm">
          <p className="text-sm text-rose-600">Đang cần ôn</p>
          <p className="mt-2 text-3xl font-semibold text-rose-900">{remediationStats.active}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-sm text-emerald-600">Đã khắc phục</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{remediationStats.remediated}</p>
        </div>
        <div className="rounded-3xl border border-violet-200/80 bg-violet-50/50 p-5 shadow-sm">
          <p className="text-sm text-violet-600">Lần ôn tập</p>
          <p className="mt-2 text-3xl font-semibold text-violet-900">{remediationStats.totalAttempts}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Chuỗi học</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.streakDays}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chủ đề cần tập trung</h2>
            <p className="text-sm text-slate-500">Bấm "Ôn ngay" để bắt đầu bài kiểm tra ôn tập cho từng chủ đề yếu.</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.weaknesses.length ? data.weaknesses.map((item) => {
            const isExpanded = expandedWeakness === item.id;
            const canRemediate = !!item.weaknessDbId;

            return (
              <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{item.topic}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${severityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                    {item.lessonTitle && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Bài liên quan: {item.lessonTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canRemediate && (
                      <Button
                        size="sm"
                        onClick={() => handleStartRemediation(item.weaknessDbId!)}
                        disabled={startingRemediation === item.weaknessDbId}
                        className="h-9 rounded-xl gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                      >
                        {startingRemediation === item.weaknessDbId
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Play className="h-3.5 w-3.5" />}
                        Ôn ngay
                      </Button>
                    )}
                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-xs text-slate-500">Rủi ro</p>
                      <p className="text-xl font-semibold text-slate-900">{item.score}</p>
                    </div>
                  </div>
                </div>

                {(item.remediationCount ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {item.initialScore != null && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                        <Clock className="h-3 w-3" /> Ban đầu: {item.initialScore}%
                      </span>
                    )}
                    {item.bestScore != null && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        <TrendingUp className="h-3 w-3" /> Tốt nhất: {item.bestScore}%
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-700">
                      <RefreshCcw className="h-3 w-3" /> {item.remediationCount} lần ôn
                    </span>
                  </div>
                )}

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

                <button
                  onClick={() => setExpandedWeakness(isExpanded ? null : item.id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? "Thu gọn" : "Xem thêm chi tiết"}
                </button>

                {isExpanded && (
                  <>
                    {(item.aiFeedback || getReviewExercises(item.reviewExercises).length > 0) && (
                      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr,1.2fr]">
                        {item.aiFeedback && (
                          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Nhận xét AI</p>
                            <p className="mt-2 text-sm text-slate-700">{item.aiFeedback}</p>
                          </div>
                        )}
                        {!!getReviewExercises(item.reviewExercises).length && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Bài tập ôn liên quan</p>
                            <div className="mt-3 space-y-2">
                              {getReviewExercises(item.reviewExercises).map((exercise, index) => (
                                <div key={`${item.id}-review-${index}`} className="rounded-xl bg-white px-3 py-3 text-sm text-slate-700">
                                  <p className="font-semibold text-slate-900">{exercise.title}</p>
                                  <p className="mt-1">{exercise.question}</p>
                                  {!!exercise.options.length && (
                                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                                      {exercise.options.map((option, optionIndex) => (
                                        <div key={`${item.id}-review-${index}-${optionIndex}`} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs">
                                          {String.fromCharCode(65 + optionIndex)}. {option}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {exercise.correctAnswer && <p className="mt-2 text-xs font-semibold text-emerald-700">Đáp án: {exercise.correctAnswer}</p>}
                                  {exercise.hint && <p className="mt-1 text-xs text-slate-500">Gợi ý: {exercise.hint}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!!item.signalBreakdown?.length && (
                      <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vì sao hệ thống xếp ưu tiên</p>
                          <p className="text-xs text-slate-400">Top {item.signalBreakdown.length} tín hiệu</p>
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
                  </>
                )}
              </div>
            );
          }) : (
            <EmptyState
              icon={BrainCircuit}
              title="Chưa phát hiện chủ đề yếu"
              description="Hệ thống sẽ phân tích khi bạn làm quiz hoặc bài tập. Hãy bắt đầu học nhé!"
              action={<Link href="/courses"><Button size="sm">Khám phá khóa học</Button></Link>}
            />
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
            Mở lộ trình học <ArrowRight className="h-4 w-4" />
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
                {item.lessonTitle && <p className="mt-1 text-xs text-slate-500">Bài liên quan: {item.lessonTitle}</p>}
                {item.aiFeedback && <p className="mt-1 text-xs text-cyan-700">AI: {item.aiFeedback}</p>}
                <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-xs text-slate-500">Điểm</p>
                <p className="text-sm font-semibold text-slate-900">{item.score ?? "--"}</p>
              </div>
            </div>
          )) : (
            <EmptyState
              icon={AlertTriangle}
              title="Chưa có lỗi sai"
              description="Chưa có lỗi sai nổi bật nào được ghi nhận. Tiếp tục làm quiz để hệ thống theo dõi."
              action={<Link href="/courses"><Button size="sm">Làm bài tập</Button></Link>}
            />
          )}
        </div>
      </section>

      <RemediationProgressSection />

      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(16,58,74,0.94)_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Bước tiếp theo</p>
            <h3 className="mt-2 text-2xl font-semibold">Chuyển các phát hiện này thành hành động học tập cụ thể</h3>
            <p className="mt-2 max-w-2xl text-sm text-white/70">Lộ trình cá nhân hóa sẽ sắp xếp thứ tự ôn tập, luyện tập và tự kiểm tra theo đúng các vùng bạn đang yếu nhất.</p>
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

type ProgressData = {
  summary: {
    totalWeaknesses: number;
    activeCount: number;
    remediatedCount: number;
    totalAttempts: number;
    passedAttempts: number;
    avgScore: number;
    remediationRate: number;
  };
  timeline: Array<{
    id: string;
    topic: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }>;
  topicProgress: Array<{
    id: string;
    topic: string;
    status: string;
    initialScore: number | null;
    bestScore: number | null;
    remediationCount: number;
    createdAt: string;
    remediatedAt: string | null;
  }>;
};

function RemediationProgressSection() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weakness-signals/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProgress(data))
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải báo cáo tiến bộ...
        </div>
      </section>
    );
  }

  if (!progress || progress.summary.totalAttempts === 0) return null;

  const { summary, timeline, topicProgress } = progress;
  const improved = topicProgress.filter((t) => t.bestScore != null && t.initialScore != null && t.bestScore > t.initialScore);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Báo cáo tiến bộ khắc phục</h2>
        <p className="text-sm text-slate-500">Theo dõi hành trình ôn luyện và cải thiện điểm yếu theo thời gian.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Tỷ lệ khắc phục</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.remediationRate}%</p>
          <p className="text-xs text-slate-400">{summary.remediatedCount}/{summary.totalWeaknesses} chủ đề</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Tổng lần ôn</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalAttempts}</p>
          <p className="text-xs text-slate-400">{summary.passedAttempts} lần đạt</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Điểm TB ôn tập</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.avgScore}%</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs text-emerald-600">Có tiến bộ</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{improved.length}</p>
          <p className="text-xs text-emerald-500">chủ đề cải thiện điểm</p>
        </div>
      </div>

      {topicProgress.filter((t) => (t.remediationCount || 0) > 0).length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tiến bộ theo chủ đề</p>
          <div className="space-y-2">
            {topicProgress.filter((t) => (t.remediationCount || 0) > 0).map((t) => {
              const initial = t.initialScore ?? 0;
              const best = t.bestScore ?? 0;
              const delta = best - initial;
              const isRemediated = t.status === "REMEDIATED";

              return (
                <div key={t.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isRemediated
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Clock className="h-4 w-4 text-orange-400" />}
                      <span className="text-sm font-semibold text-slate-900">{t.topic}</span>
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        isRemediated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700",
                      )}>
                        {isRemediated ? "Khắc phục" : "Đang ôn"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{t.remediationCount} lần ôn</span>
                      {t.initialScore != null && t.bestScore != null && (
                        <span className={cn("font-semibold", delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-slate-400")}>
                          {initial}% → {best}%
                          {delta > 0 && ` (+${delta})`}
                        </span>
                      )}
                    </div>
                  </div>
                  {t.bestScore != null && (
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", best >= 70 ? "bg-emerald-500" : "bg-orange-400")}
                        style={{ width: `${Math.min(best, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Lịch sử ôn tập gần đây</p>
          <div className="space-y-1.5">
            {timeline.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                {entry.passed
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                <span className="flex-1 text-sm text-slate-700">{entry.topic}</span>
                <span className={cn("text-xs font-semibold", entry.passed ? "text-emerald-600" : "text-rose-600")}>
                  {entry.score}%
                </span>
                <span className="text-xs text-slate-400">{formatDate(entry.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
