export interface ParentSummary {
  id: string;
  email: string;
  fullName: string | null;
}

export interface StudentProfile {
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  streakDays: number;
  lastActive: string | null;
}

export interface StudentEnrollment {
  course: {
    id: string;
    title: string;
  } | null;
}

export interface StudySessionRecord {
  durationSec: number;
}

export interface StudentRecord {
  id: string;
  email: string;
  fullName: string | null;
  gradeLevel: number | null;
  diamonds: number;
  createdAt: string;
  parentId: string | null;
  parent: ParentSummary | null;
  profile: StudentProfile | null;
  totalStudySeconds?: number;
  studySessions?: StudySessionRecord[];
  enrollments?: StudentEnrollment[];
}

export interface StudentForm {
  id: string;
  email: string;
  fullName: string;
  gradeLevel: string;
  diamonds: string;
  parentId: string;
  goals: string;
  strengths: string;
  weaknesses: string;
}

export function toLineValue(items?: string[]) {
  return (items || []).join("\n");
}

export function toListValue(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createForm(student: StudentRecord): StudentForm {
  return {
    id: student.id,
    email: student.email,
    fullName: student.fullName || "",
    gradeLevel: student.gradeLevel ? String(student.gradeLevel) : "6",
    diamonds: String(student.diamonds ?? 0),
    parentId: student.parentId || "",
    goals: toLineValue(student.profile?.goals),
    strengths: toLineValue(student.profile?.strengths),
    weaknesses: toLineValue(student.profile?.weaknesses),
  };
}

export function formatStudyTime(totalSeconds: number) {
  if (totalSeconds >= 3600) {
    return `${(totalSeconds / 3600).toFixed(1)} giờ`;
  }

  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} phút`;
}
