import { useState, useMemo } from "react";
import { StudentOption } from "@/types/assignment";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StudentSelectorProps {
  students: StudentOption[];
  selectedStudents: string[];
  onSelect: (selected: string[]) => void;
}

export function StudentSelector({ students, selectedStudents, onSelect }: StudentSelectorProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = (student.fullName || "").toLowerCase().includes(search.toLowerCase());
      const emailMatch = student.email.toLowerCase().includes(search.toLowerCase());
      const gradeMatch = gradeFilter ? student.gradeLevel === parseInt(gradeFilter) : true;
      return (nameMatch || emailMatch) && gradeMatch;
    });
  }, [students, search, gradeFilter]);

  const handleSelect = (studentId: string) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    onSelect(newSelection);
  };

  return (
    <div>
        <Label>Học sinh</Label>
        <div className="grid grid-cols-2 gap-4 mb-2">
            <Input placeholder="Tìm học sinh..." value={search} onChange={e => setSearch(e.target.value)} />
            <Input type="number" placeholder="Lọc theo lớp..." value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} />
        </div>
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
            {filteredStudents.map(student => (
                <div key={student.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                    <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleSelect(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                        {student.fullName || student.email}
                    </Label>
                    <span className="text-sm text-gray-500">{student.gradeLevel ? `Lớp ${student.gradeLevel}` : ""}</span>
                </div>
            ))}
        </div>
    </div>
  );
}
