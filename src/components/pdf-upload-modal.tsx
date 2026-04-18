"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, FileText, X, CheckCircle2, Loader2,
  ChevronRight, BookOpen, FileQuestion, FileCheck,
  Sparkles
} from "lucide-react";

interface ParsedLesson {
  title: string;
  chapter: string;
  content: string;
  order: number;
  type: "theory" | "exercise" | "quiz";
}

interface ParsedChapter {
  id: string;
  title: string;
  lessons: ParsedLesson[];
}

interface ParsedResult {
  success: boolean;
  subjectName: string;
  chapters: ParsedChapter[];
  totalLessons: number;
}

interface PdfUploadModalProps {
  subjectId: string;
  onClose: () => void;
  onSuccess: (result: ParsedResult) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "theory": return <BookOpen className="w-4 h-4" />;
    case "exercise": return <FileCheck className="w-4 h-4" />;
    case "quiz": return <FileQuestion className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "theory": return "text-blue-500 bg-blue-50";
    case "exercise": return "text-amber-500 bg-amber-50";
    case "quiz": return "text-violet-500 bg-violet-50";
    default: return "text-slate-500 bg-slate-50";
  }
};

export function PdfUploadModal({ subjectId, onClose, onSuccess }: PdfUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError("Vui lòng chọn file PDF");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else if (droppedFile) {
      setError("Vui lòng chọn file PDF");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload file to server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", subjectId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadRes.json();

      // Process PDF and extract lessons
      setUploading(false);
      setProcessing(true);

      const processRes = await fetch("/api/process-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfUrl: uploadData.fileUrl,
          subjectName: file.name.replace(".pdf", "").replace(/_/g, " ")
        }),
      });

      if (!processRes.ok) {
        throw new Error("Processing failed");
      }

      const processData: ParsedResult = await processRes.json();
      setResult(processData);
      setProcessing(false);

    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onSuccess(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tải lên sách PDF</h2>
              <p className="text-sm text-white/80">Hệ thống sẽ tự tách bài học cho bạn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!result ? (
            <>
              {/* Upload Area */}
              <div
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${file ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="p-2 rounded-lg hover:bg-slate-200"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-700 mb-2">
                      Kéo thả file PDF vào đây
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      hoặc click để chọn file
                    </p>
                    <Button variant="outline" size="sm">
                      Chọn file
                    </Button>
                  </>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
              )}

              {/* Info */}
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ phân tích nội dung PDF và tự động tách thành các bài học theo chương. 
                  Bạn có thể chỉnh sửa sau khi tải lên thành công.
                </p>
              </div>
            </>
          ) : (
            /* Preview Results */
            <div>
              <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-800">Đã phân tích thành công!</p>
                  <p className="text-sm text-emerald-600">
                    {result.totalLessons} bài học trong {result.chapters.length} chương
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {result.chapters.map((chapter, idx) => (
                  <Card key={chapter.id} className="overflow-hidden">
                    <div className={`p-3 bg-gradient-to-r ${
                      idx === 0 ? "from-blue-500 to-blue-600" :
                      idx === 1 ? "from-emerald-500 to-emerald-600" :
                      "from-violet-500 to-violet-600"
                    } text-white`}>
                      <h3 className="font-semibold">{chapter.title}</h3>
                      <p className="text-sm text-white/80">{chapter.lessons.length} bài học</p>
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {chapter.lessons.map((lesson, lessonIdx) => (
                          <div key={lessonIdx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                            <div className={`p-2 rounded-lg ${getTypeColor(lesson.type)}`}>
                              {getTypeIcon(lesson.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{lesson.title}</p>
                              <p className="text-xs text-slate-400 capitalize">{lesson.type}</p>
                            </div>
                            <span className="text-sm text-slate-400">#{lesson.order + 1}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          {!result ? (
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading || processing}
              className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-400"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Phân tích & Tách bài
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-400"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận & Lưu
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}