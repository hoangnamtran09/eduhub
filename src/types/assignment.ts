export interface StudentOption {
  id: string;
  email: string;
  fullName: string | null;
  gradeLevel: number | null;
}

export interface LessonOption {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
}

export interface AssignmentRecipient {
  id: string;
  status: string;
  submittedAt: string | null;
  student: StudentOption;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string | null;
  pdfStorageKey?: string | null;
  dueDate: string | null;
  maxScore: number;
  targetGradeLevel: number | null;
  lesson: LessonOption | null;
  recipients: AssignmentRecipient[];
}

export interface AssignmentForm {
    title: string;
    description: string;
    pdfUrl: string;
    pdfStorageKey?: string;
    subjectId: string;
    lessonId: string;
    dueDate: string;
    maxScore: number;
    targetGradeLevel: number | null;
    studentIds?: string[];
}
