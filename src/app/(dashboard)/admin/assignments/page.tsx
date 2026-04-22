"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
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
  } = useAssignments();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const closeModal = () => {
    setShowCreateModal(false);
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
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài tập..."
                  className="pl-10 w-full max-w-sm text-base"
                />
              </div>
            </div>
            <AssignmentList assignments={assignments} loading={loading} searchQuery={searchQuery} />
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
        onSubmit={handleCreateAssignment}
        onPdfUpload={handleAssignmentPdfUpload}
        pdfName={assignmentPdfName}
        isSubmitting={submitting}
        isUploading={uploadingPdf}
        error={submitError}
      />
    </>
  );
}
