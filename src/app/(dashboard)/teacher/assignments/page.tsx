"use client";

import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssignmentList } from "@/components/admin/assignments/assignment-list";
import { CreateAssignmentModal } from "@/components/admin/assignments/create-assignment-modal";
import { useAssignments } from "@/components/admin/assignments/use-assignments";
import { isAssignmentOverdue, normalizeAssignmentStatus } from "@/types/assignment";

export default function TeacherAssignmentsPage() {
  const {
    assignments,
    students,
    lessons,
    loading,
    submitting,
    uploadingPdf,
    submitError,
    form,
    setForm,
    handleCreateAssignment,
    handleAssignmentPdfUpload,
    assignmentPdfName,
    refreshAssignments,
  } = useAssignments({ apiBase: "/api/teacher" });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "accepted" | "needs_review" | "reviewed" | "returned" | "overdue">("all");

  const stats = useMemo(() => {
    let assigned = 0, accepted = 0, needsReview = 0, reviewed = 0, returned = 0, overdue = 0;
    for (const assignment of assignments) {
      for (const recipient of assignment.recipients) {
        if (recipient.status === "ASSIGNED") assigned++;
        if (recipient.status === "ACCEPTED") accepted++;
        if (recipient.status === "SUBMITTED") needsReview++;
        if (recipient.status === "REVIEWED") reviewed++;
        if (recipient.status === "RETURNED") returned++;
        if (isAssignmentOverdue(recipient.status, assignment.dueDate)) overdue++;
      }
    }
    return { assigned, accepted, needsReview, reviewed, returned, overdue };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === "all") return assignments;
    return assignments.filter((assignment) =>
      assignment.recipients.some((recipient) => {
        const normalizedStatus = normalizeAssignmentStatus(recipient.status);
        if (statusFilter === "assigned") return normalizedStatus === "assigned";
        if (statusFilter === "accepted") return normalizedStatus === "accepted";
        if (statusFilter === "needs_review") return normalizedStatus === "submitted";
        if (statusFilter === "reviewed") return normalizedStatus === "reviewed";
        if (statusFilter === "returned") return normalizedStatus === "returned";
        if (statusFilter === "overdue") return isAssignmentOverdue(recipient.status, assignment.dueDate);
        return true;
      }),
    );
  }, [assignments, statusFilter]);

  const handleSubmit = async () => {
    const success = await handleCreateAssignment();
    if (success) setShowCreateModal(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Teacher</p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Giao bài tập</h1>
              <p className="mt-2 text-sm text-gray-600">Tạo, theo dõi và chấm bài tập cho học sinh của bạn.</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Giao bài tập mới</span>
            </Button>
          </header>

          <main>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatBox label="Chưa nhận" value={stats.assigned} color="text-amber-700 bg-amber-50 border-amber-200" />
              <StatBox label="Đã nhận" value={stats.accepted} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
              <StatBox label="Chờ chấm" value={stats.needsReview} color="text-sky-700 bg-sky-50 border-sky-200" />
              <StatBox label="Đã chấm" value={stats.reviewed} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
              <StatBox label="Trả sửa" value={stats.returned} color="text-orange-700 bg-orange-50 border-orange-200" />
              <StatBox label="Quá hạn" value={stats.overdue} color="text-rose-700 bg-rose-50 border-rose-200" />
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm bài tập..." className="w-full pl-10 text-base" />
              </div>
              <div className="relative w-full sm:w-52">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 w-full appearance-none rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-100">
                  <option value="all">Tất cả</option>
                  <option value="assigned">Chưa nhận</option>
                  <option value="accepted">Đã nhận</option>
                  <option value="needs_review">Chờ chấm</option>
                  <option value="reviewed">Đã chấm</option>
                  <option value="returned">Trả sửa</option>
                  <option value="overdue">Quá hạn</option>
                </select>
              </div>
            </div>
            <AssignmentList assignments={filteredAssignments} loading={loading} searchQuery={searchQuery} detailBasePath="/teacher/assignments" reviewBasePath="/api/teacher/assignments" onReviewed={refreshAssignments} />
          </main>
        </div>
      </div>

      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        students={students}
        lessons={lessons}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onPdfUpload={handleAssignmentPdfUpload}
        pdfName={assignmentPdfName}
        isSubmitting={submitting}
        isUploading={uploadingPdf}
        error={submitError}
      />
    </>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${color}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
