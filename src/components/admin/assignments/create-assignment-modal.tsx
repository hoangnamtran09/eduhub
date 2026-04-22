"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Send } from "lucide-react";
import { AssignmentForm, StudentOption, LessonOption } from "@/types/assignment";
import { StudentSelector } from "./student-selector";
import { LessonSelector } from "./lesson-selector";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentOption[];
  lessons: LessonOption[];
  form: AssignmentForm;
  setForm: (form: AssignmentForm) => void;
  onSubmit: () => void;
  onPdfUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  pdfName: string;
  isSubmitting: boolean;
  isUploading: boolean;
  error: string;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  students,
  lessons,
  form,
  setForm,
  onSubmit,
  onPdfUpload,
  pdfName,
  isSubmitting,
  isUploading,
  error,
}: CreateAssignmentModalProps) {

  const handleStudentSelect = (selected: string[]) => {
    setForm({ ...form, studentIds: selected });
  }

  const handleLessonSelect = (lessonId: string) => {
    setForm({...form, lessonId})
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Giao bài tập mới</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Tên bài tập</Label>
              <Input id="title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="dueDate">Hạn nộp</Label>
              <Input id="dueDate" type="datetime-local" value={form.dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, dueDate: e.target.value})} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, description: e.target.value})} />
          </div>
          <LessonSelector lessons={lessons} selectedLesson={form.lessonId} onSelect={handleLessonSelect}/>
          <div>
            <Label>File PDF</Label>
            <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
              <span>{pdfName || "Tải lên file PDF"}</span>
              <input type="file" className="hidden" onChange={onPdfUpload} accept=".pdf" />
            </label>
          </div>
          <StudentSelector students={students} onSelect={handleStudentSelect} selectedStudents={form.studentIds || []}/>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || isUploading}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Giao bài
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
