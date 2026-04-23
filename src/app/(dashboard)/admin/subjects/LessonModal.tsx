import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save, Loader2, Upload, File } from "lucide-react";

interface LessonModalProps {
  open: boolean;
  onClose: () => void;
  form: any;
  setForm: (form: any) => void;
  saving: boolean;
  onSave: () => void;
  editing: boolean;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  uploading: boolean;
  uploadSuccess: boolean;
  LESSON_TYPES: { value: string; label: string; color: string }[];
  onAutoContent: () => void;
  existingPdfUrl?: string | null;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  open,
  onClose,
  form,
  setForm,
  saving,
  onSave,
  editing,
  pdfFile,
  setPdfFile,
  uploading,
  uploadSuccess,
  LESSON_TYPES,
  onAutoContent,
  existingPdfUrl,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            {editing ? "Sửa bài học" : "Thêm bài học mới"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên bài học</label>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Chương 1 - Số học"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại bài học</label>
            <div className="flex gap-2">
              {LESSON_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.type === type.value ? type.color : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
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
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                placeholder="45"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
              <Input
                value={form.videoUrl}
                onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div> */}
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Nội dung bài học (Markdown)..."
              className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File PDF bài học</label>
            {existingPdfUrl && !pdfFile && (
              <div className="mb-3 p-3 rounded-lg border border-brand-200 bg-brand-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-brand-900">PDF đã có sẵn</p>
                      <a 
                        href={existingPdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Xem file hiện tại
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${pdfFile ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-brand-400"}`}>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
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
                    <button onClick={e => { e.stopPropagation(); setPdfFile(null); }} className="ml-4 p-1 rounded-lg hover:bg-emerald-100">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">{existingPdfUrl ? "Chọn file PDF mới để thay thế" : "Chọn file PDF hoặc kéo thả vào đây"}</p>
                    <p className="text-xs mt-1">Định dạng: .pdf</p>
                  </div>
                )}
              </label>
              {pdfFile && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${uploadSuccess ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className={uploadSuccess ? "text-emerald-600" : "text-amber-600"}>
                    {uploadSuccess ? "PDF đã được chọn và sẽ được upload khi lưu" : "PDF sẽ được upload cùng lúc với bài học"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onAutoContent} disabled={saving || !form.title.trim() || uploading} className="gap-2 bg-blue-500 text-white">
            Tự động sinh nội dung
          </Button>
          <Button onClick={onSave} disabled={saving || !form.title.trim()} className="gap-2 bg-emerald-500 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu vào hệ thống
          </Button>
        </div>
      </div>
    </div>
  );
};
