"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, FileText, X, CheckCircle2, Loader2,
  ChevronRight, BookOpen, FileQuestion, FileCheck,
  Sparkles, ImageIcon, Brain
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

type UploadStep = "idle" | "uploading" | "ocr" | "analyzing" | "creating" | "done" | "error";

const STEPS = [
  { key: "uploading", label: "Đang tải file lên...", icon: Upload },
  { key: "ocr", label: "Đang nhận diện văn bản từ PDF...", icon: ImageIcon },
  { key: "analyzing", label: "Đang phân tích cấu trúc bài học...", icon: Brain },
  { key: "creating", label: "Đang tạo bài học...", icon: BookOpen },
];

const getStepIndex = (step: UploadStep): number => {
  const order: UploadStep[] = ["uploading", "ocr", "analyzing", "creating"];
  return order.indexOf(step);
};

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
  const [currentStep, setCurrentStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState(0);

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
      setCurrentStep("uploading");
      setProgress(10);

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
      setProgress(30);
      setCurrentStep("ocr");

      // Process PDF and extract lessons - OCR step
      setUploading(false);
      setProcessing(true);

      setProgress(40);

      // Simulate progress for OCR (since we can't track real progress from backend)
      const ocrInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 60) return prev + 5;
          clearInterval(ocrInterval);
          return prev;
        });
      }, 500);

      const processRes = await fetch("/api/process-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfUrl: uploadData.fileUrl,
          subjectName: file.name.replace(".pdf", "").replace(/_/g, " ")
        }),
      });

      clearInterval(ocrInterval);

      if (!processRes.ok) {
        throw new Error("Processing failed");
      }

      setProgress(70);
      setCurrentStep("analyzing");

      const processData: ParsedResult = await processRes.json();
      
      setProgress(85);
      setCurrentStep("creating");

      setResult(processData);
      setProgress(100);
      setCurrentStep("done");
      setProcessing(false);

    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setUploading(false);
      setProcessing(false);
      setCurrentStep("error");
    }
  };

  const handleConfirm = () => {
    if (result) {
      onSuccess(result);
      onClose();
    }
  };

  const renderProgress = () => {
    const stepIndex = getStepIndex(currentStep);
    const totalProgress = currentStep === "uploading" ? 25 : 
                          currentStep === "ocr" ? 50 : 
                          currentStep === "analyzing" ? 75 : 
                          currentStep === "creating" ? 90 : 
                          currentStep === "done" ? 100 : progress;

    return (
      <div className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? "bg-emerald-500 text-white" : 
                      isActive ? "bg-blue-500 text-white animate-pulse" : 
                      "bg-slate-200 text-slate-400"}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <p className={`
                    text-xs mt-2 text-center max-w-[80px]
                    ${isActive ? "text-blue-600 font-medium" : 
                      isCompleted ? "text-emerald-600" : "text-slate-400"}
                  `}>
                    {step.label.split(" ")[0]}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${index < stepIndex ? "bg-emerald-500" : "bg-slate-200"}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {STEPS[stepIndex]?.label || "Đang xử lý..."}
            </span>
            <span className="text-blue-600 font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Current Step Detail */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <p className="text-sm text-blue-700">
            {currentStep === "uploading" && "Đang upload file PDF lên server..."}
            {currentStep === "ocr" && "Đang quét từng trang PDF để trích xuất văn bản..."}
            {currentStep === "analyzing" && "Đang phân tích AI để tách chương và bài học..."}
            {currentStep === "creating" && "Đang tạo cấu trúc bài học trong database..."}
            {currentStep === "done" && "Hoàn tất! Đang chuyển sang xem kết quả..."}
          </p>
        </div>
      </div>
    );
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
          {/* Show progress when processing */}
          {(uploading || processing) && currentStep !== "idle" ? (
            <div className="py-8">
              {renderProgress()}
            </div>
          ) : !result ? (
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
              {uploading || processing ? (
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