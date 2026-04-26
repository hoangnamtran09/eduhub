"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AssignmentCard } from "@/components/admin/assignments/assignment-card";
import { Button } from "@/components/ui/button";
import { AssignmentRecord, normalizeAssignmentStatus } from "@/types/assignment";

export default function AdminAssignmentDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadAssignment = useCallback(async () => {
    if (!params.assignmentId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/assignments/${params.assignmentId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải chi tiết bài tập");
      setAssignment(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải chi tiết bài tập");
    } finally {
      setLoading(false);
    }
  }, [params.assignmentId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const summary = useMemo(() => {
    const recipients = assignment?.recipients || [];
    return {
      assigned: recipients.filter((item) => normalizeAssignmentStatus(item.status) === "assigned").length,
      accepted: recipients.filter((item) => normalizeAssignmentStatus(item.status) === "accepted").length,
      submitted: recipients.filter((item) => normalizeAssignmentStatus(item.status) === "submitted").length,
      reviewed: recipients.filter((item) => normalizeAssignmentStatus(item.status) === "reviewed").length,
      returned: recipients.filter((item) => normalizeAssignmentStatus(item.status) === "returned").length,
    };
  }, [assignment]);

  const handleExport = async () => {
    if (!assignment) return;

    setExporting(true);
    try {
      const response = await fetch(`/api/admin/assignments/${assignment.id}/export`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể xuất báo cáo");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assignment-${assignment.id}-review-report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!assignment) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Không tìm thấy bài tập.</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/admin/assignments" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách bài tập
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Chi tiết bài tập</h1>
          <p className="mt-2 text-sm text-slate-500">Trang làm việc tập trung cho review, theo dõi trạng thái và xuất báo cáo.</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Xuất báo cáo Excel-compatible
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Chưa nhận" value={summary.assigned} />
        <StatTile label="Đã nhận" value={summary.accepted} />
        <StatTile label="Chờ chấm" value={summary.submitted} />
        <StatTile label="Đã chấm" value={summary.reviewed} />
        <StatTile label="Trả sửa" value={summary.returned} />
      </div>

      <AssignmentCard assignment={assignment} onReviewed={loadAssignment} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
