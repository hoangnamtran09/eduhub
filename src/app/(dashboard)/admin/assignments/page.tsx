"use client";

import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssignmentList } from "@/components/admin/assignments/assignment-list";
import { CreateAssignmentModal } from "@/components/admin/assignments/create-assignment-modal";
import { useAssignments } from "@/components/admin/assignments/use-assignments";

export default function AdminAssignmentsPage() {
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
  } = useAssignments();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "needs_review" | "reviewed" | "returned" | "overdue">("all");

  const stats = useMemo(() => {
    let needsReview = 0, reviewed = 0, returned = 0, overdue = 0;
    for (const a of assignments) {
      for (const r of a.recipients) {
        if (r.status === "submitted") needsReview++;
        if (r.status === "reviewed") reviewed++;
        if (r.status === "returned") returned++;
        if (a.dueDate && new Date(a.dueDate).getTime() < Date.now() && !["submitted", "reviewed"].includes(r.status)) overdue++;
      }
    }
    return { needsReview, reviewed, returned, overdue };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === "all") return assignments;
    return assignments.filter((a) =>
      a.recipients.some((r) => {
        if (statusFilter === "needs_review") return r.status === "submitted";
        if (statusFilter === "reviewed") return r.status === "reviewed";
        if (statusFilter === "returned") return r.status === "returned";
        if (statusFilter === "overdue") return a.dueDate && new Date(a.dueDate).getTime() < Date.now() && !["submitted", "reviewed"].includes(r.status);
        return true;
      })
    );
  }, [assignments, statusFilter]);

  const closeModal = () => {
    setShowCreateModal(false);
  };

  const handleSubmit = async () => {
    const success = await handleCreateAssignment();
    if (success) {
      closeModal();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Giao bài tập
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Tạo và quản lý các bài tập đã giao cho học sinh.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Giao bài tập mới</span>
            </Button>
          </header>

          <main>
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Chờ chấm" value={stats.needsReview} color="text-sky-700 bg-sky-50 border-sky-200" />
              <StatBox label="Đã chấm" value={stats.reviewed} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
              <StatBox label="Trả sửa" value={stats.returned} color="text-orange-700 bg-orange-50 border-orange-200" />
              <StatBox label="Quá hạn" value={stats.overdue} color="text-rose-700 bg-rose-50 border-rose-200" />
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài tập..."
                  className="pl-10 w-full text-base"
                />
              </div>
              <div className="relative w-full sm:w-52">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-10 w-full appearance-none rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">Tất cả</option>
                  <option value="needs_review">Chờ chấm</option>
                  <option value="reviewed">Đã chấm</option>
                  <option value="returned">Trả sửa</option>
                  <option value="overdue">Quá hạn</option>
                </select>
              </div>
            </div>
            <AssignmentList assignments={filteredAssignments} loading={loading} searchQuery={searchQuery} onReviewed={refreshAssignments} />
          </main>
        </div>
      </div>

      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={closeModal}
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
