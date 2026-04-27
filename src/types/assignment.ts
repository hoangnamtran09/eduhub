export const ASSIGNMENT_RECIPIENT_STATUSES = ["ASSIGNED", "ACCEPTED", "SUBMITTED", "REVIEWED", "RETURNED"] as const;

export type AssignmentRecipientStatus = typeof ASSIGNMENT_RECIPIENT_STATUSES[number];

export type NormalizedAssignmentRecipientStatus = Lowercase<AssignmentRecipientStatus>;

export const TERMINAL_ASSIGNMENT_STATUSES: NormalizedAssignmentRecipientStatus[] = ["submitted", "reviewed", "returned"];

export function normalizeAssignmentStatus(status: string): NormalizedAssignmentRecipientStatus {
  return String(status).toLowerCase() as NormalizedAssignmentRecipientStatus;
}

export function isAssignmentSubmitted(status: string): boolean {
  return TERMINAL_ASSIGNMENT_STATUSES.includes(normalizeAssignmentStatus(status));
}

export function isAssignmentPending(status: string) {
  return normalizeAssignmentStatus(status) === "assigned";
}

export function isAssignmentOverdue(status: string, dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now() && !["submitted", "reviewed"].includes(normalizeAssignmentStatus(status));
}

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
  status: AssignmentRecipientStatus;
  submissionText?: string | null;
  submissionFiles?: AssignmentSubmissionFile[] | null;
  score: number | null;
  aiScore: number | null;
  feedback?: string | null;
  rubricScores?: RubricScore[] | null;
  feedbackEvents?: FeedbackHistoryItem[] | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  returnedAt?: string | null;
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
  status: AssignmentRecipientStatus;
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
