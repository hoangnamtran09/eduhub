"use client";

import { AssignmentRecord, AssignmentRecipient, RubricCriterion } from "@/types/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  BookOpen,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Bot,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  assigned: { label: "Chưa nhận", variant: "outline" },
  accepted: { label: "Đã nhận", variant: "secondary" },
  submitted: { label: "Đã nộp", variant: "default", className: "bg-sky-600" },
  reviewed: { label: "Đã chấm", variant: "default", className: "bg-emerald-600" },
  returned: { label: "Trả lại sửa", variant: "default", className: "bg-orange-600" },
  overdue: { label: "Quá hạn", variant: "destructive" },
};

function getStatusKey(status: string, dueDate: string | null): string {
  if (["submitted", "reviewed", "returned"].includes(status)) return status;
  if (dueDate && new Date(dueDate).getTime() < Date.now() && !["submitted", "reviewed"].includes(status)) return "overdue";
  return status;
}

interface ReviewDraft {
  score: string;
  feedback: string;
  rubricScores: Record<string, string>;
}

interface AssignmentCardProps {
  assignment: AssignmentRecord;
  onReviewed?: () => void;
}

export function AssignmentCard({ assignment, onReviewed }: AssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});

  const rubric: RubricCriterion[] = Array.isArray(assignment.rubric) ? assignment.rubric : [];
  const submittedCount = assignment.recipients.filter((r) => ["submitted", "reviewed", "returned"].includes(r.status)).length;
  const reviewedCount = assignment.recipients.filter((r) => r.status === "reviewed").length;

  const getDraft = (recipientId: string): ReviewDraft => {
    if (reviewDrafts[recipientId]) return reviewDrafts[recipientId];
    const defaultRubric: Record<string, string> = {};
    rubric.forEach((c) => { defaultRubric[c.id] = ""; });
    return { score: "", feedback: "", rubricScores: defaultRubric };
  };

  const updateDraft = (recipientId: string, patch: Partial<ReviewDraft>) => {
    const current = getDraft(recipientId);
    setReviewDrafts((prev) => ({ ...prev, [recipientId]: { ...current, ...patch } }));
  };

  const prefillFromAI = (recipient: AssignmentRecipient) => {
    const rs: Record<string, string> = {};
    if (Array.isArray(recipient.rubricScores)) {
      recipient.rubricScores.forEach((s) => { rs[s.criterionId] = String(s.score); });
    }
    updateDraft(recipient.id, {
      score: recipient.aiScore != null ? String(recipient.aiScore) : "",
      feedback: recipient.feedback || "",
      rubricScores: rs,
    });
  };

  const submitReview = async (recipient: AssignmentRecipient, action: "review" | "return") => {
    const draft = getDraft(recipient.id);
    setReviewingId(recipient.id);
    try {
      const rubricScoresPayload = rubric.map((c) => ({
        criterionId: c.id,
        title: c.title,
        score: Number(draft.rubricScores[c.id]) || 0,
        maxScore: c.maxScore,
      }));

      const response = await fetch(`/api/admin/assignments/recipients/${recipient.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          score: draft.score ? Number(draft.score) : null,
          feedback: draft.feedback,
          rubricScores: rubricScoresPayload,
        }),
      });
      if (!response.ok) throw new Error("Failed to review submission");
      onReviewed?.();
    } catch (error) {
      console.error(error);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="cursor-pointer p-4" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            {assignment.title}
            {assignment.lesson && <Badge variant="outline">{assignment.lesson.subjectName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">{submittedCount} nộp</span>
            <span className="text-emerald-600 font-semibold">{reviewedCount} chấm</span>
            <Badge variant={submittedCount === assignment.recipients.length ? "default" : "secondary"}>
              {assignment.recipients.length} HS
            </Badge>
            {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <div className="border-t pt-4 space-y-4">
            <p className="text-sm text-gray-600">{assignment.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <InfoItem icon={Calendar} label="Hạn nộp" value={assignment.dueDate ? new Date(assignment.dueDate).toLocaleString("vi-VN") : "Không có"} />
              <InfoItem icon={Users} label="Đối tượng" value={assignment.targetGradeLevel ? `Lớp ${assignment.targetGradeLevel}` : `${assignment.recipients.length} học sinh`} />
              {assignment.lesson && <InfoItem icon={BookOpen} label="Bài học" value={assignment.lesson.title} />}
              {assignment.pdfUrl && <InfoItem icon={FileText} label="Tài liệu" value={<a href={assignment.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Xem PDF</a>} />}
            </div>

            {rubric.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Rubric chấm điểm</p>
                <div className="grid gap-1">
                  {rubric.map((c) => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span className="text-slate-700">{c.title}{c.description ? ` – ${c.description}` : ""}</span>
                      <span className="text-slate-500 font-medium">{c.maxScore} đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 className="font-semibold text-sm">Danh sách học sinh ({assignment.recipients.length})</h4>

            <div className="space-y-2">
              {assignment.recipients.map((recipient) => {
                const statusKey = getStatusKey(recipient.status, assignment.dueDate);
                const statusCfg = STATUS_MAP[statusKey] || STATUS_MAP.assigned;
                const isOpen = expandedRecipient === recipient.id;
                const hasSubmission = ["submitted", "reviewed", "returned"].includes(recipient.status);
                const draft = getDraft(recipient.id);

                return (
                  <div key={recipient.id} className="rounded-lg border border-slate-200 bg-white">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedRecipient(isOpen ? null : recipient.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <span className="font-medium text-sm">{recipient.student.fullName || recipient.student.email}</span>
                        {recipient.attemptCount > 1 && <span className="text-xs text-slate-400">lần {recipient.attemptCount}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {recipient.aiScore != null && (
                          <span className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                            <Bot className="w-3 h-3" /> AI: {recipient.aiScore}/{assignment.maxScore}
                          </span>
                        )}
                        {recipient.score != null && (
                          <span className="text-xs text-emerald-700 font-bold">{recipient.score}/{assignment.maxScore}</span>
                        )}
                        <Badge variant={statusCfg.variant} className={statusCfg.className}>{statusCfg.label}</Badge>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t px-4 py-3 space-y-3">
                        {hasSubmission && (
                          <>
                            {recipient.submissionText && (
                              <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Nội dung bài nộp</p>
                                <p className="whitespace-pre-line text-sm text-slate-700">{recipient.submissionText}</p>
                              </div>
                            )}
                            {!!recipient.submissionFiles?.length && (
                              <div className="flex flex-wrap gap-2">
                                {recipient.submissionFiles.map((file) => (
                                  <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
                                    <FileText className="w-3 h-3" /> {file.name}
                                  </a>
                                ))}
                              </div>
                            )}
                            {recipient.submittedAt && (
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" /> Nộp lúc {new Date(recipient.submittedAt).toLocaleString("vi-VN")}
                              </p>
                            )}
                          </>
                        )}

                        {recipient.aiScore != null && (
                          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600 mb-2">
                              <Bot className="w-3.5 h-3.5" /> Chấm sơ bộ AI
                            </p>
                            <p className="text-sm font-bold text-violet-900">Điểm AI: {recipient.aiScore}/{assignment.maxScore}</p>
                            {recipient.feedback && recipient.status === "submitted" && (
                              <p className="mt-1 text-sm text-violet-800 whitespace-pre-line">{recipient.feedback}</p>
                            )}
                            {Array.isArray(recipient.rubricScores) && recipient.rubricScores.length > 0 && recipient.status === "submitted" && (
                              <div className="mt-2 grid gap-1">
                                {recipient.rubricScores.map((rs) => (
                                  <div key={rs.criterionId} className="flex justify-between text-xs text-violet-700">
                                    <span>{rs.title}</span>
                                    <span className="font-medium">{rs.score}/{rs.maxScore}{rs.comment ? ` – ${rs.comment}` : ""}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {recipient.status === "submitted" && (
                              <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => prefillFromAI(recipient)}>
                                Dùng điểm AI làm mẫu
                              </Button>
                            )}
                          </div>
                        )}

                        {recipient.status === "submitted" && (
                          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Chấm bài</p>
                            {rubric.length > 0 && (
                              <div className="grid gap-2">
                                {rubric.map((c) => (
                                  <div key={c.id} className="flex items-center gap-3">
                                    <label className="text-sm text-slate-700 flex-1">{c.title} <span className="text-slate-400">(/{c.maxScore})</span></label>
                                    <Input
                                      type="number" min={0} max={c.maxScore} className="w-20 h-8 text-sm"
                                      value={draft.rubricScores[c.id] || ""}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const updated = { ...draft.rubricScores, [c.id]: e.target.value };
                                        updateDraft(recipient.id, { rubricScores: updated });
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-slate-700 font-medium">Tổng điểm <span className="text-slate-400">(/{assignment.maxScore})</span></label>
                              <Input
                                type="number" min={0} max={assignment.maxScore} className="w-24 h-8 text-sm"
                                value={draft.score}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft(recipient.id, { score: e.target.value })}
                                placeholder="0"
                              />
                            </div>
                            <Textarea
                              className="text-sm min-h-[80px]" placeholder="Nhận xét cho học sinh..."
                              value={draft.feedback}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateDraft(recipient.id, { feedback: e.target.value })}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => submitReview(recipient, "review")} disabled={reviewingId === recipient.id} className="bg-emerald-600 hover:bg-emerald-700">
                                {reviewingId === recipient.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                Chấm điểm
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => submitReview(recipient, "return")} disabled={reviewingId === recipient.id} className="text-orange-700 border-orange-300 hover:bg-orange-50">
                                {reviewingId === recipient.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                                Trả lại sửa
                              </Button>
                            </div>
                          </div>
                        )}

                        {recipient.status === "reviewed" && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">Kết quả chấm</p>
                            {recipient.score != null && <p className="text-sm font-bold text-emerald-900">Điểm: {recipient.score}/{assignment.maxScore}</p>}
                            {recipient.feedback && <p className="mt-1 text-sm text-emerald-800 whitespace-pre-line">{recipient.feedback}</p>}
                            {Array.isArray(recipient.rubricScores) && recipient.rubricScores.length > 0 && (
                              <div className="mt-2 grid gap-1">
                                {recipient.rubricScores.map((rs) => (
                                  <div key={rs.criterionId} className="flex justify-between text-xs text-emerald-700">
                                    <span>{rs.title}</span>
                                    <span className="font-medium">{rs.score}/{rs.maxScore}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {recipient.status === "returned" && (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-orange-600 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Đã trả lại để sửa
                            </p>
                            {recipient.feedback && <p className="text-sm text-orange-800 whitespace-pre-line">{recipient.feedback}</p>}
                            {recipient.returnedAt && (
                              <p className="mt-1 text-xs text-orange-500">Trả lúc {new Date(recipient.returnedAt).toLocaleString("vi-VN")}</p>
                            )}
                          </div>
                        )}

                        {!!recipient.feedbackHistory?.length && (
                          <div className="rounded-lg border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Lịch sử phản hồi ({recipient.feedbackHistory.length})</p>
                            <div className="space-y-2">
                              {recipient.feedbackHistory.map((entry, idx) => (
                                <div key={`${entry.createdAt}-${idx}`} className="rounded bg-slate-50 p-2 text-sm">
                                  <div className="flex justify-between text-xs text-slate-500">
                                    <span>{entry.status === "returned" ? "Trả lại sửa" : "Đã chấm"}{entry.attemptCount ? ` (lần ${entry.attemptCount})` : ""}</span>
                                    <span>{new Date(entry.createdAt).toLocaleString("vi-VN")}</span>
                                  </div>
                                  {entry.score != null && <p className="text-xs font-semibold mt-1">Điểm: {entry.score}/{assignment.maxScore}</p>}
                                  {entry.feedback && <p className="text-slate-600 mt-1 whitespace-pre-line">{entry.feedback}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-500 mt-0.5" />
      <div>
        <p className="text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
