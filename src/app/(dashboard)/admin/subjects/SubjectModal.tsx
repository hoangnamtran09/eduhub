import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save, Loader2 } from "lucide-react";

interface SubjectModalProps {
  open: boolean;
  onClose: () => void;
  form: any;
  setForm: (form: any) => void;
  saving: boolean;
  onSave: () => void;
  editing: boolean;
  ICONS: string[];
  COLORS: { name: string; value: string; gradient: string }[];
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  open,
  onClose,
  form,
  setForm,
  saving,
  onSave,
  editing,
  ICONS,
  COLORS,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            {editing ? "Sửa môn học" : "Thêm môn học mới"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên môn học</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Toán, Tiếng Anh, Vật Lý"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về môn học..."
              className="w-full h-20 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? "bg-brand-100 ring-2 ring-brand-500" : "bg-slate-100 hover:bg-slate-200"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setForm({ ...form, color: color.value })}
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br transition-all ${color.gradient} ${form.color === color.value ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
                />
              ))}
            </div>
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
