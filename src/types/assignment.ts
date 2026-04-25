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
  submissionText: string | null;
  submissionFiles?: AssignmentSubmissionFile[] | null;
  score: number | null;
  aiScore: number | null;
  feedback: string | null;
  rubricScores?: RubricScore[] | null;
  feedbackHistory?: FeedbackHistoryItem[] | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  returnedAt: string | null;
  attemptCount: number;
  student: StudentOption;
}

export interface AssignmentSubmissionFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface RubricCriterion {
  id: string;
  title: string;
  maxScore: number;
  description?: string;
}

export interface RubricScore {
  criterionId: string;
  title: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface FeedbackHistoryItem {
  status: string;
  score?: number | null;
  feedback?: string | null;
  createdAt: string;
  reviewerId?: string | null;
  attemptCount?: number;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string | null;
  pdfStorageKey?: string | null;
  dueDate: string | null;
  maxScore: number;
  rubric?: RubricCriterion[] | null;
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
    rubric?: RubricCriterion[];
    targetGradeLevel: number | null;
    studentIds?: string[];
}
