"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { 
  BookOpen, ChevronLeft, ChevronRight, PlayCircle, FileText, 
  Loader2, AlertCircle, ArrowLeft, Trophy, CheckCircle2
} from "lucide-react";

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
  completed?: boolean;
  completedAt?: string | null;
}

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

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
        {/* Subject Header */}
        <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-white/80 shadow-panel">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-white shrink-0",
            `bg-gradient-to-br ${subject.gradient}`
          )}>
            {subject.icon}
          </div>
          <div className="flex-1">
            <PageHeader
              title={subject.name}
              description={`${totalLessons} bài học đang chờ bạn`}
              actions={
                <Button
                  variant="link"
                  onClick={() => router.push('/courses')}
                  className="h-auto p-0 text-slate-400 hover:text-brand-600 transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span className="font-bold text-xs uppercase tracking-widest">Quay lại</span>
                </Button>
              }
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="space-y-8">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <h2 className="font-serif text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] px-4 whitespace-nowrap">
                      {course.title}
                    </h2>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  
                  <div className="space-y-4">
                  {course.chapters.map((chapter, idx) => (
                    <div key={chapter.id} className="bg-white rounded-2xl border border-white/80 shadow-soft overflow-hidden group hover:border-brand-200 transition-all">
                      {/* Chapter Header */}
                      <div className="px-6 py-4 flex items-center justify-between bg-paper-50/60 border-b border-paper-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base font-bold text-slate-900 shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{chapter.title}</h3>
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
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                  lesson.completed
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-slate-200 group-hover/lesson:border-brand-500",
                                )}>
                                  {lesson.completed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/lesson:bg-brand-500 transition-all" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-700 group-hover/lesson:text-slate-900 transition-colors">
                                    {lesson.title}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tight">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Lý thuyết
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                      {lesson.duration} phút
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className={cn(
                                  "rounded-xl px-5 h-9 font-bold text-xs transition-all shadow-sm",
                                  lesson.completed
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-white text-slate-900 border border-paper-200 hover:bg-brand-500 hover:text-white hover:border-brand-500",
                                )}
                              >
                                {lesson.completed ? "Đã học" : "Học ngay"}
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
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có bài học nào</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Môn học này hiện chưa được cập nhật nội dung bài học. Vui lòng quay lại sau.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
