"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  BookOpen, ChevronLeft, ChevronRight, PlayCircle, FileText, 
  Loader2, AlertCircle, ArrowLeft, Upload, Trophy
} from "lucide-react";
import { PdfUploadModal } from "@/components/pdf-upload-modal";

interface Subject {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  description?: string;
  coursesCount: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  gradeLevel: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  duration: number;
  hasExercise: boolean;
  hasQuiz: boolean;
}

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${params.subjectId}`);
        if (response.ok) {
          const data = await response.json();
          setSubject({
            id: data.id,
            name: data.name,
            icon: data.icon,
            gradient: data.gradient,
            description: data.description,
            coursesCount: data.courses.length,
          });
          setCourses(data.courses);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [params.subjectId]);

  const totalLessons = courses.reduce((acc, course) => 
    acc + course.chapters.reduce((a, ch) => a + ch.lessons.length, 0), 0);

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${params.subjectId}/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold tracking-tight">Đang chuẩn bị nội dung...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Không tìm thấy môn học</p>
          <Button onClick={() => router.push('/courses')} className="mt-4">
            Quay lại danh sách môn học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Subject Header Section - Compact */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-white shrink-0",
              `bg-gradient-to-br ${subject.gradient}`
            )}>
              {subject.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button 
                  variant="link" 
                  onClick={() => router.push('/courses')}
                  className="h-auto p-0 text-slate-400 hover:text-brand-600 transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">Quay lại</span>
                </Button>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[9px] font-bold uppercase tracking-wider border border-brand-100">
                  Lớp {courses[0]?.gradeLevel || "11"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                {subject.name}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                {totalLessons} bài học đang chờ bạn
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setShowUploadModal(true)}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-100 transition-all rounded-xl h-11 px-6 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span className="font-bold text-sm">Tải lên PDF</span>
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-4 whitespace-nowrap">
                      {course.title}
                    </h2>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  
                  <div className="space-y-4">
                  {course.chapters.map((chapter, idx) => (
                    <div key={chapter.id} className="bg-white rounded-[28px] border border-slate-200/60 shadow-sm overflow-hidden group hover:border-brand-200 transition-all">
                      {/* Chapter Header */}
                      <div className="px-6 py-4 flex items-center justify-between bg-slate-50/30 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base font-bold text-slate-900 shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{chapter.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              Chương {idx + 1} • {chapter.lessons.length} bài học
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lessons List */}
                      <div className="divide-y divide-slate-100">
                        {chapter.lessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson.id)}
                            className="flex items-center justify-between px-6 py-3.5 hover:bg-brand-50/40 transition-all cursor-pointer group/lesson"
                          >
                              <div className="flex items-center gap-5">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover/lesson:border-brand-500 transition-colors">
                                  <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/lesson:bg-brand-500 transition-all" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-700 group-hover/lesson:text-slate-900 transition-colors">
                                    {lesson.title}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Lý thuyết
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                      {lesson.duration} phút
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-white text-slate-900 border border-slate-200 hover:bg-brand-500 hover:text-white hover:border-brand-500 rounded-xl px-5 h-9 font-bold text-xs transition-all shadow-sm"
                              >
                                Học ngay
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có bài học nào</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Môn học này hiện chưa được cập nhật nội dung bài học. Vui lòng quay lại sau.</p>
              </div>
            )}
          </div>

          {/* Sidebar Stats Area */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[32px] border-none bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-brand-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 bg-white/5 px-3 py-1 rounded-full">Tiến độ</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Chương trình học</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Hãy bắt đầu bài học đầu tiên để theo dõi tiến độ của bạn nhé!</p>
                
                <div className="space-y-6">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 w-[4%] rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đã học</p>
                      <p className="text-2xl font-bold tracking-tight">0 <span className="text-sm font-medium text-slate-500">/ {totalLessons}</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thời gian</p>
                      <p className="text-2xl font-bold tracking-tight">0 <span className="text-sm font-medium text-slate-500">h</span></p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-500/20 transition-colors" />
            </Card>

            <Card className="rounded-[32px] border-slate-200/60 p-8 shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Liên kết hữu ích</h3>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold">Tài liệu ôn tập</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <PlayCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-semibold">Video bài giảng</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <PdfUploadModal
          subjectId={params.subjectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

