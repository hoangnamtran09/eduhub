// User types
export type UserRole = "STUDENT" | "PARENT" | "ADMIN" | "TEACHER";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  gradeLevel?: number;
  diamonds: number;
  emailVerified?: Date;
  createdAt: Date;
  profile?: StudentProfile;
  parentId?: string;
  children?: User[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  streakDays: number;
  lastActive?: Date;
}

// Subject & Course types
export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  courses?: Course[];
}

export interface Course {
  id: string;
  subjectId: string;
  subject?: Subject;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  gradeLevel: number;
  isPublished: boolean;
  chapters?: Chapter[];
  _count?: {
    chapters: number;
    enrollments: number;
  };
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons?: Lesson[];
  _count?: {
    lessons: number;
  };
}

export interface Lesson {
  id: string;
  chapterId: string;
  chapter?: Chapter;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  duration?: number;
  quizzes?: Quiz[];
  progress?: LessonProgress;
  _count?: {
    quizzes: number;
  };
}

// Quiz types
export interface Quiz {
  id: string;
  lessonId: string;
  title?: string;
  questions?: QuizQuestion[];
  _count?: {
    questions: number;
  };
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
  order: number;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  startedAt: Date;
  completedAt?: Date;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

// Progress types
export interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: Date;
  course?: Course;
}

// AI Tutor types
export interface AIConversation {
  id: string;
  lessonId?: string;
  userId: string;
  messages: AIMessage[];
  createdAt: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: any;
  createdAt: Date;
}

export interface ExerciseAttempt {
  id: string;
  userId: string;
  lessonId?: string;
  exerciseTitle: string;
  question: string;
  userAnswer: string;
  aiFeedback?: string;
  score?: number;
  diamondsEarned: number;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  lessonId?: string;
  createdById?: string;
  dueDate?: Date;
  maxScore: number;
  targetGradeLevel?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentRecipient {
  id: string;
  assignmentId: string;
  studentId: string;
  status: string;
  submissionText?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
}

// Progress Stats
export interface ProgressStats {
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalStudyTime: number; // minutes
  streakDays: number;
  weakTopics: string[];
  strongTopics: string[];
}

// Dashboard
export interface DashboardData {
  todayGoal: string;
  streakDays: number;
  weeklyProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  recentActivity: ActivityItem[];
  recommendedLessons: Lesson[];
  weakAreas: WeakArea[];
}

export interface ActivityItem {
  id: string;
  type: "lesson" | "quiz" | "chat";
  title: string;
  timestamp: Date;
  score?: number;
}

export interface WeakArea {
  topic: string;
  lessonId: string;
  attempts: number;
  lastScore: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface ProfileForm {
  fullName: string;
  gradeLevel: number;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
}
