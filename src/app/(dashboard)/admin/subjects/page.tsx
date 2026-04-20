"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Loader2,
  X,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
  File,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  isPublished: boolean;
  pdfUrl?: string | null;
}

interface Semester {
  id: string;
  name: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  semesters: Semester[];
  totalLessons: number;
}

const COLORS = [
  { name: "Xanh dương", value: "blue", gradient: "from-blue-500 to-cyan-400" },
  { name: "Cam", value: "amber", gradient: "from-amber-500 to-orange-400" },
  { name: "Xanh lá", value: "emerald", gradient: "from-emerald-500 to-teal-400" },
  { name: "Tím", value: "violet", gradient: "from-violet-500 to-purple-400" },
  { name: "Đỏ", value: "red", gradient: "from-red-500 to-pink-400" },
  { name: "Hồng", value: "pink", gradient: "from-pink-500 to-rose-400" },
];

const ICONS = ["📐", "📝", "🧪", "🌍", "📚", "🎨", "🎵", "⚽", "💻", "🔬"];

const LESSON_TYPES = [
  { value: "theory", label: "Lý thuyết", color: "bg-blue-100 text-blue-700" },
  { value: "exercise", label: "Bài tập", color: "bg-amber-100 text-amber-700" },
  { value: "quiz", label: "Bài kiểm tra", color: "bg-violet-100 text-violet-700" },
];

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    description: "",
    icon: "📐",
    color: "blue",
  });

  const [semesterForm, setSemesterForm] = useState({
    name: "",
    description: "",
    order: 1,
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    type: "theory",
    duration: "",
    videoUrl: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleSemester = (id: string) => {
    const newExpanded = new Set(expandedSemesters);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSemesters(newExpanded);
  };

  // Subject CRUD
  const openSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name,
        description: subject.description || "",
        icon: subject.icon || "📐",
        color: subject.color || "blue",
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: "",
        description: "",
        icon: "📐",
        color: "blue",
      });
    }
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectForm.name.trim()) return;
    setSaving(true);
    try {
      const url = "/api/admin/subjects";
      const method = editingSubject ? "PUT" : "POST";
      const body = editingSubject
        ? JSON.stringify({ id: editingSubject.id, ...subjectForm })
        : JSON.stringify(subjectForm);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        setShowSubjectModal(false);
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to save subject:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa môn học này?")) return;
    
    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to delete subject:", err);
    }
  };

  // Semester CRUD
  const openSemesterModal = (subjectId: string, semester?: Semester) => {
    setSelectedSubjectId(subjectId);
    if (semester) {
      setEditingSemester(semester);
      setSemesterForm({
        name: semester.name,
        description: semester.description || "",
        order: semester.order,
      });
    } else {
      setEditingSemester(null);
      setSemesterForm({
        name: "",
        description: "",
        order: 1,
      });
    }
    setShowSemesterModal(true);
  };

  const handleSaveSemester = async () => {
    if (!semesterForm.name.trim() || !selectedSubjectId) return;
    
    setSaving(true);
    try {
      const url = editingSemester 
        ? `/api/admin/subjects/${selectedSubjectId}/semesters?id=${editingSemester.id}`
        : `/api/admin/subjects/${selectedSubjectId}/semesters`;
      const method = editingSemester ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(semesterForm),
      });

      if (res.ok) {
        setShowSemesterModal(false);
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to save semester:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSemester = async (subjectId: string, semesterId: string) => {
    if (!confirm("Bạn có chắc muốn xóa học kì này?")) return;
    
    try {
      const res = await fetch(
        `/api/admin/subjects/${subjectId}/semesters?id=${semesterId}`, 
        { method: "DELETE" }
      );
      if (res.ok) {
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to delete semester:", err);
    }
  };

  // Lesson CRUD
  const openLessonModal = (subjectId: string, semesterId: string, lesson?: Lesson) => {
    setSelectedSubjectId(subjectId);
    setSelectedSemesterId(semesterId);
    setPdfFile(null);
    setUploadSuccess(false);
    setSaving(false);
    setUploading(false);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
        duration: lesson.duration?.toString() || "",
        videoUrl: lesson.videoUrl || "",
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: "",
        content: "",
        type: "theory",
        duration: "",
        videoUrl: "",
      });
    }
    setShowLessonModal(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !selectedSubjectId || !selectedSemesterId) return;
    
    setSaving(true);
    try {
      const url = editingLesson 
        ? `/api/admin/subjects/${selectedSubjectId}/semesters/${selectedSemesterId}/lessons?id=${editingLesson.id}`
        : `/api/admin/subjects/${selectedSubjectId}/semesters/${selectedSemesterId}/lessons`;
      const method = editingLesson ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLesson?.id,
          ...lessonForm,
          duration: lessonForm.duration ? parseInt(lessonForm.duration) : null,
        }),
      });

      if (res.ok) {
        setShowLessonModal(false);
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to save lesson:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (subjectId: string, semesterId: string, lessonId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài học này?")) return;
    
    try {
      const res = await fetch(
        `/api/admin/subjects/${subjectId}/semesters/${semesterId}/lessons?id=${lessonId}`, 
        { method: "DELETE" }
      );
      if (res.ok) {
        loadSubjects();
      }
    } catch (err) {
      console.error("Failed to delete lesson:", err);
    }
  };

  const getGradient = (color: string) => {
    return COLORS.find(c => c.value === color)?.gradient || "from-blue-500 to-cyan-400";
  };

  const getLessonTypeColor = (type: string) => {
    return LESSON_TYPES.find(t => t.value === type)?.color || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-brand-500" />
              Quản lý Môn học
            </h1>
            <p className="text-slate-500 mt-1">
              Tạo môn học, học kì và bài học cho hệ thống
            </p>
          </div>
          <Button 
            onClick={() => openSubjectModal()}
            className="gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
            Thêm môn học
          </Button>
        </div>

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa có môn học nào</h3>
            <p className="text-slate-500 mb-6">Bắt đầu bằng cách thêm môn học đầu tiên</p>
            <Button onClick={() => openSubjectModal()} className="gap-2">
              <Plus className="w-5 h-5" />
              Thêm môn học đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className="overflow-hidden">
                {/* Subject Header */}
                <div 
                  className={cn(
                    "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                    "bg-gradient-to-r", getGradient(subject.color || "blue")
                  )}
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                        {subject.icon || "📐"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{subject.name}</h3>
                        <p className="text-white/80 text-sm">
                          {subject.semesters.length} học kì • {subject.totalLessons} bài học
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSemesterModal(subject.id);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Học kì
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSubjectModal(subject);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedSubjects.has(subject.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Semesters */}
                {expandedSubjects.has(subject.id) && (
                  <CardContent className="p-4 bg-white">
                    {subject.semesters.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có học kì nào</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => openSemesterModal(subject.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm học kì đầu tiên
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subject.semesters.map((semester) => (
                          <div key={semester.id} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Semester Header */}
                            <div 
                              className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                              onClick={() => toggleSemester(semester.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-brand-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900">{semester.name}</h4>
                                  <p className="text-xs text-slate-500">
                                    {semester.lessons.length} bài học
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLessonModal(subject.id, semester.id);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Bài học
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSemesterModal(subject.id, semester);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSemester(subject.id, semester.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {expandedSemesters.has(semester.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            {/* Lessons */}
                            {expandedSemesters.has(semester.id) && (
                              <div className="p-3 bg-white border-t border-slate-100">
                                {semester.lessons.length === 0 ? (
                                  <div className="text-center py-6 text-slate-400">
                                    <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                    <p className="text-sm">Chưa có bài học nào</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {semester.lessons.map((lesson, index) => (
                                      <div 
                                        key={lesson.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                                            {index + 1}
                                          </span>
                                          <div>
                                            <p className="font-medium text-slate-900">{lesson.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getLessonTypeColor(lesson.type))}>
                                                {LESSON_TYPES.find(t => t.value === lesson.type)?.label}
                                              </span>
                                              {lesson.duration && (
                                                <span className="text-xs text-slate-400">
                                                  {lesson.duration} phút
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => openLessonModal(subject.id, semester.id, lesson)}
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => handleDeleteLesson(subject.id, semester.id, lesson.id)}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSubject ? "Sửa môn học" : "Thêm môn học mới"}
              </h2>
              <button 
                onClick={() => setShowSubjectModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên môn học</label>
                <Input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                  placeholder="VD: Toán, Tiếng Anh, Vật Lý"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                  placeholder="Mô tả ngắn về môn học..."
                  className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Biểu tượng</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSubjectForm({...subjectForm, icon})}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all",
                        subjectForm.icon === icon 
                          ? "bg-brand-100 ring-2 ring-brand-500" 
                          : "bg-slate-100 hover:bg-slate-200"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSubjectForm({...subjectForm, color: color.value})}
                      className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br transition-all",
                        color.gradient,
                        subjectForm.color === color.value && "ring-2 ring-offset-2 ring-slate-900"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setShowSubjectModal(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleSaveSubject}
                disabled={saving || !subjectForm.name.trim()}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Semester Modal */}
      {showSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSemester ? "Sửa học kì" : "Thêm học kì mới"}
              </h2>
              <button 
                onClick={() => setShowSemesterModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên học kì</label>
                <Input
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({...semesterForm, name: e.target.value})}
                  placeholder="VD: Học kì 1, Học kì 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={semesterForm.description}
                  onChange={(e) => setSemesterForm({...semesterForm, description: e.target.value})}
                  placeholder="Mô tả ngắn về học kì..."
                  className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự</label>
                <Input
                  type="number"
                  min="1"
                  value={semesterForm.order}
                  onChange={(e) => setSemesterForm({...semesterForm, order: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setShowSemesterModal(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleSaveSemester}
                disabled={saving || !semesterForm.name.trim()}
                className="gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingLesson ? "Sửa bài học" : "Thêm bài học mới"}
              </h2>
              <button 
                onClick={() => setShowLessonModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên bài học</label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  placeholder="VD: Chương 1 - Số học"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại bài học</label>
                <div className="flex gap-2">
                  {LESSON_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setLessonForm({...lessonForm, type: type.value})}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        lessonForm.type === type.value 
                          ? type.color 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời lượng (phút)</label>
                  <Input
                    type="number"
                    min="1"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                    placeholder="45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
                  <Input
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                  placeholder="Nội dung bài học (Markdown)..."
                  className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File PDF bài học</label>
                <div className={cn(
                  "border-2 border-dashed rounded-xl p-4 text-center transition-colors",
                  pdfFile ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-brand-400"
                )}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setPdfFile(e.target.files?.[0] || null);
                      setUploadSuccess(false);
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer block">
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <File className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-900">{pdfFile.name}</p>
                          <p className="text-xs text-slate-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPdfFile(null); setUploadSuccess(false); }}
                          className="ml-4 p-1 rounded-lg hover:bg-emerald-100"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Chọn file PDF hoặc kéo thả vào đây</p>
                        <p className="text-xs mt-1">Định dạng: .pdf</p>
                      </div>
                    )}
                  </label>
                </div>
                {pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      uploadSuccess ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <span className={uploadSuccess ? "text-emerald-600" : "text-amber-600"}>
                      {uploadSuccess ? "PDF đã được chọn và sẽ được upload khi lưu" : "PDF sẽ được upload cùng lúc với bài học"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setShowLessonModal(false)}>
                Hủy
              </Button>
              <Button 
                onClick={async () => {
                  if (!lessonForm.title.trim() || !selectedSubjectId || !selectedSemesterId) return;
                  
                  setSaving(true);
                  setUploadSuccess(false);
                  try {
                    // Build the lesson data
                    const lessonData = {
                      title: lessonForm.title,
                      content: lessonForm.content || "",
                      videoUrl: lessonForm.videoUrl || null,
                      duration: lessonForm.duration ? parseInt(lessonForm.duration) : null,
                      type: lessonForm.type || "theory",
                    };

                    let savedLesson = null;

                    if (editingLesson) {
                      // Update existing lesson
                      const res = await fetch(
                        `/api/admin/subjects/${selectedSubjectId}/semesters/${selectedSemesterId}/lessons?id=${editingLesson.id}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: editingLesson.id,
                            ...lessonData,
                            order: editingLesson.order,
                            isPublished: editingLesson.isPublished,
                          }),
                        }
                      );
                      
                      if (!res.ok) {
                        const errorText = await res.text();
                        console.error("Failed to update lesson:", res.status, errorText);
                        throw new Error(`Không thể cập nhật bài học (${res.status})`);
                      }
                      
                      savedLesson = await res.json();
                    } else {
                      // Create new lesson
                      const res = await fetch(
                        `/api/admin/subjects/${selectedSubjectId}/semesters/${selectedSemesterId}/lessons`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(lessonData),
                        }
                      );
                      
                      if (!res.ok) {
                        const errorText = await res.text();
                        console.error("Failed to create lesson:", res.status, errorText);
                        throw new Error(`Không thể tạo bài học (${res.status})`);
                      }
                      
                      savedLesson = await res.json();
                    }
                    
                    // Upload PDF if selected
                    if (pdfFile && savedLesson?.id) {
                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", pdfFile);
                        const pdfRes = await fetch(
                          `/api/admin/subjects/${selectedSubjectId}/semesters/${selectedSemesterId}/lessons/${savedLesson.id}/pdf`,
                          { method: "POST", body: formData }
                        );
                        
                        if (!pdfRes.ok) {
                          const errorText = await pdfRes.text();
                          console.error("Failed to upload PDF:", pdfRes.status, errorText);
                          // Continue anyway - lesson is saved, PDF is optional
                          console.warn("PDF upload failed but lesson was saved");
                        }
                      } catch (pdfErr) {
                        console.error("PDF upload error:", pdfErr);
                        // Continue anyway
                      }
                      setUploading(false);
                    }
                    
                    setUploadSuccess(true);
                    setPdfFile(null);
                    loadSubjects();
                    
                    // Show success for 1 second before closing
                    setTimeout(() => {
                      setShowLessonModal(false);
                      setUploadSuccess(false);
                    }, 1000);
                  } catch (err: any) {
                    console.error("Save lesson error:", err);
                    alert(err.message || "Đã xảy ra lỗi khi lưu bài học. Vui lòng thử lại.");
                  } finally {
                    setSaving(false);
                    setUploading(false);
                  }
                }}
                disabled={saving || !lessonForm.title.trim() || uploading}
                className={cn(
                  "gap-2 transition-all",
                  uploadSuccess && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {uploadSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Đã lưu thành công!
                  </>
                ) : saving || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? "Đang upload PDF..." : "Đang lưu..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu{pdfFile ? " + Upload PDF" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}