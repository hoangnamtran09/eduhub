"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardList, Loader2, SendHorizonal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface StudentAssignment {
  id: string;
  status: string;
  submissionText: string | null;
  submittedAt: string | null;
  assignment: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    maxScore: number;
    lesson: {
      id: string;
      title: string;
      subjectId: string;
      subject: {
        name: string;
      };
    } | null;
  };
}

export default function AssignmentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const loadAssignments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to load assignments");
      }

      const data = await response.json();
      setItems(data);
      setDrafts(
        (data || []).reduce((acc: Record<string, string>, item: StudentAssignment) => {
          acc[item.id] = item.submissionText || "";
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [user?.id]);

  const stats = useMemo(() => {
    const submitted = items.filter((item) => item.status === "submitted").length;
    const pending = items.length - submitted;
    const overdue = items.filter((item) => item.assignment.dueDate && new Date(item.assignment.dueDate).getTime() < Date.now() && item.status !== "submitted").length;

    return { submitted, pending, overdue };
  }, [items]);

  const handleSubmit = async (recipientId: string) => {
    const submissionText = drafts[recipientId]?.trim();
    if (!submissionText) return;

    setSavingId(recipientId);
    try {
      const response = await fetch(`/api/assignments/${recipientId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assignment");
      }

      await loadAssignments();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-500" />
          <p className="font-medium text-slate-500">Đang tải bài tập của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-panel md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
                <ClipboardList className="h-3.5 w-3.5" />
                Assignment Registry
              </span>
              <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Bài tập được giao</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Theo dõi bài tập giáo viên giao, mở nhanh bài học liên quan và nộp bài trực tiếp trong một màn hình tập trung.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <SmallStat label="Chờ nộp" value={stats.pending} />
              <SmallStat label="Đã nộp" value={stats.submitted} />
              <SmallStat label="Quá hạn" value={stats.overdue} />
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {items.map((item) => {
            const isSubmitted = item.status === "submitted";
            const isOverdue = item.assignment.dueDate && new Date(item.assignment.dueDate).getTime() < Date.now() && !isSubmitted;

            return (
              <Card key={item.id} className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-soft">
                <div className={cn(
                  "px-6 py-5",
                  isSubmitted ? "bg-emerald-50" : isOverdue ? "bg-rose-50" : "bg-brand-50"
                )}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <span>{item.assignment.lesson?.subject.name || "Bài tập tự do"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{item.assignment.maxScore} điểm</span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.assignment.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.assignment.description}</p>
                    </div>

                    <span className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold",
                      isSubmitted ? "bg-emerald-100 text-emerald-700" : isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {isSubmitted ? "Đã nộp" : isOverdue ? "Quá hạn" : "Đang chờ nộp"}
                    </span>
                  </div>
                </div>

                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    <MetaRow icon={CalendarClock} text={item.assignment.dueDate ? `Hạn nộp: ${new Date(item.assignment.dueDate).toLocaleString("vi-VN")}` : "Không có hạn nộp"} />
                    <MetaRow icon={BookOpenCheck} text={item.assignment.lesson ? `Bài học liên quan: ${item.assignment.lesson.title}` : "Không gắn với bài học cụ thể"} />
                  </div>

                  {item.assignment.lesson && (
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => router.push(`/courses/${item.assignment.lesson?.subjectId}/${item.assignment.lesson?.id}`)}
                    >
                      Mở bài học liên quan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  <div className="rounded-[24px] border border-paper-200 bg-paper-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Bài làm của bạn</h3>
                      {item.submittedAt && (
                        <span className="text-xs text-slate-500">Nộp lúc {new Date(item.submittedAt).toLocaleString("vi-VN")}</span>
                      )}
                    </div>

                    <textarea
                      value={drafts[item.id] || ""}
                      onChange={(e) => setDrafts((current) => ({ ...current, [item.id]: e.target.value }))}
                      placeholder="Nhập bài làm, lời giải hoặc ghi chú nộp bài..."
                      className="min-h-[180px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/5"
                    />

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 className="h-4 w-4" />
                        {isSubmitted ? "Bạn có thể cập nhật và nộp lại nếu cần" : "Hệ thống lưu theo dạng tự luận"}
                      </div>
                      <Button onClick={() => handleSubmit(item.id)} disabled={savingId === item.id} className="rounded-2xl bg-ink-900 text-white hover:bg-ink-800">
                        {savingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
                        {isSubmitted ? "Nộp lại" : "Nộp bài"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-paper-300 bg-white/80 px-6 py-16 text-center shadow-soft">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-700">Chưa có bài tập nào được giao</h2>
              <p className="mt-2 text-sm text-slate-500">Khi admin giao bài, danh sách sẽ xuất hiện tại đây cùng hạn nộp và nút nộp bài.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/94 px-4 py-3 text-center shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MetaRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50/70 px-4 py-3 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-brand-500" />
      <span>{text}</span>
    </div>
  );
}
