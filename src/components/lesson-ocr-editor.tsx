import { useState } from "react";
import { Button } from "@/components/ui/button";
interface OcrPage {
  pageNumber: number;
  imageUrl: string;
  ocrText: string;
}

interface LessonOcrEditorProps {
  ocrPages: OcrPage[];
  lessonId: string;
}

export function LessonOcrEditor({ ocrPages, lessonId }: LessonOcrEditorProps) {
  const [pages, setPages] = useState<OcrPage[]>(ocrPages);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (idx: number, value: string) => {
    setPages((prev) => prev.map((p, i) => i === idx ? { ...p, ocrText: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Gộp text các trang, marker --- TRANG X ---
      const fullText = pages.map(p => `--- TRANG ${p.pageNumber} ---\n${p.ocrText}`).join("\n\n");
      const res = await fetch("/api/save-lesson-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, text: fullText }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold mb-4">Hiệu đính OCR cho bài học</h2>
      {pages.map((page, idx) => (
        <div key={page.pageNumber} className="flex gap-6 items-start mb-8">
          <img src={page.imageUrl} alt={`Trang ${page.pageNumber}`} className="w-56 border rounded shadow" />
          <div className="flex-1">
            <div className="mb-2 font-semibold">Trang {page.pageNumber}</div>
            <textarea
              className="w-full min-h-[120px] border rounded p-2 text-sm"
              value={page.ocrText}
              onChange={e => handleTextChange(idx, e.target.value)}
            />
          </div>
        </div>
      ))}
      <Button onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Đang lưu..." : "Lưu vào Vector Store"}
      </Button>
      {success && <div className="text-green-600 mt-2">Đã lưu thành công!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
