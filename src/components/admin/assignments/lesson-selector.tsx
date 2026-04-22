import { useState, useMemo } from "react";
import { LessonOption } from "@/types/assignment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LessonSelectorProps {
  lessons: LessonOption[];
  selectedLesson: string;
  onSelect: (lessonId: string) => void;
}

export function LessonSelector({ lessons, selectedLesson, onSelect }: LessonSelectorProps) {
  const [subjectFilter, setSubjectFilter] = useState("");

  const subjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    lessons.forEach(l => subjectMap.set(l.subjectId, l.subjectName));
    return Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (!subjectFilter) return lessons;
    return lessons.filter(l => l.subjectId === subjectFilter);
  }, [lessons, subjectFilter]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Môn học</Label>
        <Select onValueChange={setSubjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn môn học" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Bài học</Label>
        <Select onValueChange={onSelect} value={selectedLesson} disabled={!subjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn bài học" />
          </SelectTrigger>
          <SelectContent>
            {filteredLessons.map(lesson => (
              <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
