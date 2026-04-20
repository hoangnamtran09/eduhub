import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save, Loader2 } from "lucide-react";

interface SemesterModalProps {
  open: boolean;
  onClose: () => void;
  form: any;
  setForm: (form: any) => void;
  saving: boolean;
  onSave: () => void;
  editing: boolean;
}

export const SemesterModal: React.FC<SemesterModalProps> = ({
  open,
  onClose,
  form,
  setForm,
  saving,
  onSave,
  editing,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            {editing ? "Sửa học kì" : "Thêm học kì mới"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên học kì</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Học kì 1, Học kì 2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về học kì..."
              className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự</label>
            <Input
              type="number"
              min="1"
              value={form.order}
              onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSave} disabled={saving || !form.name.trim()} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
};
