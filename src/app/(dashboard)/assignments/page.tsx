"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CalendarClock, CheckCircle2, ClipboardList, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
    pdfUrl: string | null;
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
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [accepting, setAccepting] = useState(false);

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
    const accepted = items.filter((item) => item.status === "accepted").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const overdue = items.filter((item) => item.assignment.dueDate && new Date(item.assignment.dueDate).getTime() < Date.now() && item.status === "pending").length;

    return { accepted, pending, overdue };
  }, [items]);

  const handleAcceptAssignment = async (recipientId: string, pdfUrl: string | null) => {
    setAccepting(true);
    try {
      // Cập nhật trạng thái
      const response = await fetch(`/api/assignments/${recipientId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to accept assignment");
      }

      // Tải PDF nếu có
      if (pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${selectedAssignment?.assignment.title || 'bai-tap'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      await loadAssignments();
      setSelectedAssignment(null);
    } catch (error) {
      console.error(error);
    } finally {
      setAccepting(false);
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
        <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                <ClipboardList className="h-3.5 w-3.5" />
                Bài tập
              </span>
              <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Bài tập được giao</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Xem và nhận bài tập được giao từ giáo viên.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <SmallStat label="Chưa nhận" value={stats.pending} />
              <SmallStat label="Đã nhận" value={stats.accepted} />
              <SmallStat label="Quá hạn" value={stats.overdue} />
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {items.map((item) => {
            const isAccepted = item.status === "accepted";
            const isOverdue = item.assignment.dueDate && new Date(item.assignment.dueDate).getTime() < Date.now() && !isAccepted;

            return (
              <Card key={item.id} className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
                <div className={cn(
                  "px-6 py-5",
                  isAccepted ? "bg-emerald-50" : isOverdue ? "bg-rose-50" : "bg-amber-50"
                )}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>{item.assignment.lesson?.subject.name || "Bài tập tự do"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{item.assignment.maxScore} điểm</span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.assignment.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.assignment.description}</p>
                    </div>

                    <span className={cn(
                      "rounded-md px-4 py-2 text-xs font-semibold",
                      isAccepted ? "bg-emerald-100 text-emerald-700" : isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {isAccepted ? "Đã nhận" : isOverdue ? "Quá hạn" : "Chưa nhận"}
                    </span>
                  </div>
                </div>

                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    <MetaRow icon={CalendarClock} text={item.assignment.dueDate ? `Hạn nộp: ${new Date(item.assignment.dueDate).toLocaleString("vi-VN")}` : "Không có hạn nộp"} />
                    <MetaRow icon={BookOpenCheck} text={item.assignment.lesson ? `Bài học: ${item.assignment.lesson.title}` : "Không gắn với bài học"} />
                  </div>

                  {!isAccepted && (
                    <Button
                      onClick={() => setSelectedAssignment(item)}
                      className="w-full"
                    >
                      Xem chi tiết và nhận bài tập
                    </Button>
                  )}

                  {isAccepted && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bạn đã nhận bài tập này</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-soft">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-700">Chưa có bài tập nào được giao</h2>
              <p className="mt-2 text-sm text-slate-500">Khi giáo viên giao bài, danh sách sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>
      </div>

      {/* Popup chi tiết bài tập */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.assignment.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Mô tả</h3>
              <p className="text-sm text-slate-600">{selectedAssignment?.assignment.description}</p>
            </div>

            {selectedAssignment?.assignment.lesson && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Bài học liên quan</h3>
                <div className="rounded-lg border border-ink-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{selectedAssignment.assignment.lesson.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedAssignment.assignment.lesson.subject.name}</p>
                </div>
              </div>
            )}

            {selectedAssignment?.assignment.dueDate && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Hạn nộp</h3>
                <p className="text-sm text-slate-600">{new Date(selectedAssignment.assignment.dueDate).toLocaleString("vi-VN")}</p>
              </div>
            )}

            {selectedAssignment?.assignment.pdfUrl && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-brand-700">
                  <Download className="h-4 w-4" />
                  <span>Bài tập có file PDF đính kèm, sẽ tự động tải về khi bạn nhận bài</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)}>Đóng</Button>
            <Button 
              onClick={() => handleAcceptAssignment(selectedAssignment!.id, selectedAssignment!.assignment.pdfUrl)}
              disabled={accepting}
            >
              {accepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Nhận bài tập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-center shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MetaRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-brand-500" />
      <span>{text}</span>
    </div>
  );
}
