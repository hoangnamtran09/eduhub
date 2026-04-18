"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Search, 
  Upload, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  description?: string;
  totalLessons: number;
  coursesCount: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error("Failed to load subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-[0.15em] border border-brand-100">
                LMS Pro
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                {subjects.length} môn học
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Khám phá môn học</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <Input
                placeholder="Tìm môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-60 bg-white border-slate-200 focus:ring-4 focus:ring-brand-500/5 transition-all rounded-xl text-xs font-bold"
              />
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)} 
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-100 transition-all rounded-xl h-10 px-6"
            >
              <Upload className="w-4 h-4" />
              <span className="font-bold text-sm">Tải lên PDF</span>
            </Button>
          </div>
        </div>

        {/* Subjects Grid - Optimized for space */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => router.push(`/courses/${subject.id}`)}
              className="group cursor-pointer"
            >
              <Card className="bg-white rounded-[28px] border border-slate-200/60 shadow-sm group-hover:shadow-2xl group-hover:shadow-slate-200 group-hover:border-brand-200 transition-all duration-500 overflow-hidden h-full flex flex-col">
                {/* Compact Visual Header */}
                <div className={cn(
                  "h-32 relative flex items-center justify-center text-4xl transition-transform duration-700 group-hover:scale-110",
                  `bg-gradient-to-br ${subject.gradient || "from-brand-500 to-brand-600"}`
                )}>
                  <span className="relative z-10 drop-shadow-lg">{subject.icon}</span>
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] m-3 rounded-[20px] border border-white/10" />
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-brand-600 transition-colors leading-snug">
                      {subject.name}
                    </h3>
                    <p className="text-slate-500 text-[11px] font-medium line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {subject.description || "Học tập hiệu quả với các bài học được cấu trúc khoa học và sự hỗ trợ từ AI."}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{subject.totalLessons}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bài học</span>
                      </div>
                      <div className="w-px h-5 bg-slate-100" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{subject.coursesCount}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Khóa học</span>
                      </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-brand-500 flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSubjects.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy môn học</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto px-6">Thử tìm kiếm với từ khóa khác hoặc tải lên tài liệu mới để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Simplified Upload Modal Backdrop */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-100">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Tạo khóa học AI</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tải PDF & Phân tích</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Upload className="w-6 h-6 text-slate-300 group-hover:text-brand-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-0.5">Kéo thả file PDF</p>
                  <p className="text-[10px] text-slate-400">hoặc click để chọn file</p>
                  <input type="file" id="pdfFile" accept=".pdf" className="hidden" />
                </div>
              </label>

              <div className="space-y-3">
                <Input 
                  id="subjectName" 
                  placeholder="Tên môn học (VD: Toán 6)" 
                  className="h-12 px-4 bg-slate-50 border-transparent focus:bg-white rounded-xl font-bold text-xs"
                />
                <Input 
                  id="courseTitle" 
                  placeholder="Tên khóa học (VD: Chương 1 - Số học)" 
                  className="h-12 px-4 bg-slate-50 border-transparent focus:bg-white rounded-xl font-bold text-xs"
                />
                <select 
                  id="gradeLevel" 
                  className="w-full h-12 px-4 bg-slate-50 border-transparent focus:bg-white rounded-xl text-xs font-bold focus:ring-4 focus:ring-brand-500/5 transition-all outline-none border border-slate-100"
                >
                  {[6,7,8,9,10,11,12].map(lv => (
                    <option key={lv} value={lv}>Lớp {lv}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowUploadModal(false)} 
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button 
                className="flex-2 h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold gap-2 shadow-lg shadow-slate-100 text-xs px-8"
                onClick={async () => {
                  const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
                  const subjectName = (document.getElementById('subjectName') as HTMLInputElement).value;
                  const courseTitle = (document.getElementById('courseTitle') as HTMLInputElement).value;
                  const gradeLevel = parseInt((document.getElementById('gradeLevel') as HTMLSelectElement).value);
                  
                  if (!fileInput.files?.[0]) {
                    alert('Vui lòng chọn file PDF');
                    return;
                  }
                  
                  const formData = new FormData();
                  formData.append('file', fileInput.files[0]);
                  formData.append('subjectName', subjectName);
                  formData.append('courseTitle', courseTitle);
                  formData.append('gradeLevel', gradeLevel.toString());
                  
                  try {
                    const response = await fetch('/api/upload-pdf', {
                      method: 'POST',
                      body: formData
                    });
                    
                    if (response.ok) {
                      setShowUploadModal(false);
                      window.location.reload();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Bắt đầu tạo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
