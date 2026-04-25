import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AssignmentRecord, StudentOption, LessonOption, AssignmentForm } from "@/types/assignment";

const emptyForm: AssignmentForm = {
  title: "",
  description: "",
  pdfUrl: "",
  pdfStorageKey: "",
  subjectId: "",
  lessonId: "",
  dueDate: "",
  maxScore: 10,
  rubric: [
    { id: "content", title: "Nội dung", maxScore: 6, description: "Độ đúng, đầy đủ và bám sát yêu cầu" },
    { id: "presentation", title: "Trình bày", maxScore: 4, description: "Cách diễn đạt, bố cục và minh chứng" },
  ],
  targetGradeLevel: null,
  studentIds: [],
};

export function useAssignments() {
  const user = useAuthStore((state) => state.user);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [assignmentPdfName, setAssignmentPdfName] = useState("");
  const [form, setForm] = useState<AssignmentForm>(emptyForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentRes, studentRes, subjectRes] = await Promise.all([
        fetch("/api/admin/assignments"),
        fetch("/api/admin/students"),
        fetch("/api/admin/subjects"),
      ]);

      const [assignmentData, studentData, subjectData] = await Promise.all([
        assignmentRes.json(),
        studentRes.json(),
        subjectRes.json(),
      ]);

      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);

      const normalizedStudents = Array.isArray(studentData)
        ? studentData
        : Array.isArray(studentData?.students)
          ? studentData.students
          : [];
      setStudents(normalizedStudents);

      const normalizedSubjects = Array.isArray(subjectData) ? subjectData : [];
      const lessonOptions = normalizedSubjects.flatMap((subject: any) =>
        (subject.lessons || []).map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          subjectId: subject.id,
          subjectName: subject.name,
        }))
      );

      setLessons(lessonOptions);
    } catch (error) {
      console.error("Failed to load admin assignments page:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setSubmitError("Vui lòng nhập đầy đủ tên bài tập và mô tả.");
      return false;
    }

    if (!form.studentIds?.length) {
        setSubmitError("Vui lòng chọn học sinh để giao bài.");
        return false;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          createdById: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create assignment");
      }

      await loadData();
      setForm(emptyForm);
      setAssignmentPdfName("");
      return true;
    } catch (error) {
      console.error(error);
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo bài tập.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentPdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      event.target.value = "";
      return;
    }

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/assignments/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload assignment PDF");
      }

      const data = await response.json();
      setForm((current: AssignmentForm) => ({
        ...current,
        pdfUrl: data.fileUrl,
        pdfStorageKey: data.storageKey || "",
      }));
      setAssignmentPdfName(data.fileName || file.name);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingPdf(false);
      event.target.value = "";
    }
  };

  return {
    assignments,
    students,
    lessons,
    loading,
    submitting,
    uploadingPdf,
    submitError,
    assignmentPdfName,
    form,
    setForm,
    handleCreateAssignment,
    handleAssignmentPdfUpload,
    refreshAssignments: loadData,
  };
}
