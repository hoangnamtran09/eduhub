import { AssignmentRecord, AssignmentRecipient } from "@/types/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AssignmentCardProps {
  assignment: AssignmentRecord;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const submittedCount = assignment.recipients.filter((r: AssignmentRecipient) => r.status === 'submitted').length;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader
        className="cursor-pointer p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            {assignment.title}
            {assignment.lesson && <Badge variant="outline">{assignment.lesson.subjectName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant={submittedCount === assignment.recipients.length ? "default" : "secondary"}>
              {submittedCount} / {assignment.recipients.length} đã nộp
            </Badge>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">{assignment.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <InfoItem icon={Calendar} label="Hạn nộp" value={assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('vi-VN') : 'Không có'} />
                <InfoItem icon={Users} label="Đối tượng" value={assignment.targetGradeLevel ? `Lớp ${assignment.targetGradeLevel}` : `${assignment.recipients.length} học sinh`} />
                {assignment.lesson && <InfoItem icon={BookOpen} label="Bài học" value={assignment.lesson.title} />}
                {assignment.pdfUrl && <InfoItem icon={FileText} label="Tài liệu" value={<a href={assignment.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Xem PDF</a>} />}
            </div>
            <h4 className="font-semibold mb-2">Học sinh được giao</h4>
            <div className="space-y-2">
              {assignment.recipients.map((recipient: AssignmentRecipient) => (
                <div key={recipient.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                    <p className="font-medium text-sm">{recipient.student.fullName || recipient.student.email}</p>
                    <Badge variant={recipient.status === 'submitted' ? 'default' : 'outline'}>
                      {recipient.status === 'submitted' ? 'Đã nộp' : 'Chưa nộp'}
                    </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function InfoItem({icon: Icon, label, value}: {icon: React.ElementType, label: string, value: React.ReactNode}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
                <p className="text-gray-500">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}
