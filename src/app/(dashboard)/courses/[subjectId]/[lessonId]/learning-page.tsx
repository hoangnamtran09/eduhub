"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/pdf-viewer";
import MarkdownMessage from "@/components/ai/MarkdownMessage";
import type { QuizAnswerPayload } from "@/components/ai/InteractiveQuiz";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  FileText,
  Plus,
  History,
  X,
  Clock,
  Sparkles,
  Loader2,
  Gem,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  order: number;
  duration: number;
  hasPdf: boolean;
  hasVideo: boolean;
  hasQuiz: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  lessons: LessonItem[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type CompletionQuizQuestion = {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  explanation: string;
};

type CompletionQuiz = {
  id: string;
  title?: string | null;
  questions: CompletionQuizQuestion[];
};

type CompletionQuizResult = {
  score: number;
  totalQuestions: number;
  percentage: number;
  results: Array<{
    questionId: string;
    question: string;
    selectedOptionText: string | null;
    correctOptionText: string | null;
    isCorrect: boolean;
    explanation: string;
  }>;
};

type WeaknessPopup = {
  id: string;
  title: string;
  message: string;
  lessonTitle?: string | null;
  aiFeedback?: string | null;
  reviewExerciseCount: number;
  status?: string | null;
};

function toChatHistoryMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const normalizedRole = message.role === "user" ? "user" : "assistant";
      const normalizedContent = typeof message.content === "string"
        ? message.content.trim().slice(0, 10_000)
        : "";

      return {
        role: normalizedRole,
        content: normalizedContent,
      };
    })
    .filter((message) => message.content.length > 0);
}

function getAssistantMessageVariant(content: string) {
  const normalized = content.toLowerCase();
  const questionSignals = ["hãy trả lời", "câu hỏi", "bài tập", "hãy nhập", "trả lời", "### 📝", "?"];
  return questionSignals.some((signal) => normalized.includes(signal)) ? "question" : "theory";
}

type FilterTab = "all" | "file" | "question";

const mathSymbols = [
  { label: "x²", value: "^2" },
  { label: "xⁿ", value: "^{}" },
  { label: "√", value: "sqrt()" },
  { label: "π", value: "pi" },
  { label: "∞", value: "infinity" },
  { label: "±", value: "±" },
  { label: "≠", value: "≠" },
  { label: "≤", value: "≤" },
  { label: "≥", value: "≥" },
  { label: "∑", value: "sum()" },
  { label: "∫", value: "integral()" },
  { label: "∆", value: "∆" },
  { label: "θ", value: "θ" },
  { label: "sin", value: "sin()" },
  { label: "cos", value: "cos()" },
  { label: "tan", value: "tan()" },
  { label: "log", value: "log()" },
  { label: "frac", value: "()/()" },
];

const learningGuideSteps = [
  {
    title: "Chọn bài học",
    description: "Dùng danh sách tiết học bên trái để mở đúng bài cần xem hoặc chuyển nhanh sang bài khác.",
  },
  {
    title: "Đọc tài liệu",
    description: "Xem PDF ở khung giữa; hệ thống tự ghi nhớ trang đang đọc và yêu cầu đọc đủ thời gian trước khi chat AI.",
  },
  {
    title: "Hỏi AI Tutor",
    description: "Sau khi mở khóa, bấm Bắt đầu học ngay để AI tóm tắt bài, giải thích kiến thức và đặt câu hỏi luyện tập.",
  },
  {
    title: "Làm trắc nghiệm AI",
    description: "Bấm Tạo trắc nghiệm AI, nhập câu trả lời; kết quả sẽ cập nhật điểm yếu, roadmap và thưởng kim cương khi làm tốt.",
  },
  {
    title: "Kết thúc học",
    description: "Bấm Kết thúc học để lưu tiến độ, ghi nhận thời gian học và làm bài đánh giá cuối phiên nếu hệ thống tạo ra.",
  },
];

export default function LearningPage({
  params,
}: {
  params: { subjectId: string; lessonId: string };
}) {
  const MAX_TOTAL_READ_SECONDS = 95;
  const STUDY_PING_SECONDS = 15;
  const router = useRouter();
  const { setCollapsed } = useSidebarStore();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Collapse sidebar to maximize content area when entering learning page
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonItem | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [initialPdfPage, setInitialPdfPage] = useState(1);
  const [pageReadSeconds, setPageReadSeconds] = useState<Record<number, number>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const studySessionIdRef = useRef<string | null>(null);
  const studyUnsyncedSecondsRef = useRef(0);
  const studyStartedRef = useRef(false);
  const activeConversationIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingLesson, setIsEndingLesson] = useState(false);
  const [hasExistingChatHistory, setHasExistingChatHistory] = useState(false);
  const [studySessionActive, setStudySessionActive] = useState(false);
  const [chatMode, setChatMode] = useState<"text" | "math">("text");
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);
  const [completionQuiz, setCompletionQuiz] = useState<CompletionQuiz | null>(null);
  const [completionAnswers, setCompletionAnswers] = useState<Record<string, string>>({});
  const [completionResult, setCompletionResult] = useState<CompletionQuizResult | null>(null);
  const [isSubmittingCompletionQuiz, setIsSubmittingCompletionQuiz] = useState(false);
  const [weaknessPopup, setWeaknessPopup] = useState<WeaknessPopup | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const handleQuizCorrect = async () => {
    if (!user) return;

    const diamondAward = 2;
    try {
      // Persistence: Update diamonds in database
      const response = await fetch("/api/ai/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: diamondAward,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          ...user,
          diamonds: data.diamonds,
        });
      } else {
        // Fallback to local update if API fails but show error
        console.error("Failed to persist diamonds reward");
        setUser({
          ...user,
          diamonds: (user.diamonds || 0) + diamondAward,
        });
      }
    } catch (error) {
      console.error("Failed to update diamonds:", error);
    }
  };

  const recordWeaknessSignal = useCallback(async (input: {
    topic?: string;
    question?: string;
    userAnswer?: string;
    correctAnswer?: string;
    reason: string;
    source: "QUIZ" | "EXERCISE";
    isResolved?: boolean;
    score?: number;
    lessonId?: string;
  }) => {
    try {
      const response = await fetch("/api/weakness-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Failed to record weakness signal (${response.status})`);
      }

      const data = await response.json();
      const lessonWeakness = data.lessonWeakness;
      const popupId = `${Date.now()}`;

      setWeaknessPopup({
        id: popupId,
        title: input.isResolved ? "Đã cập nhật điểm yếu" : "Đã ghi nhận lỗi sai",
        message: input.isResolved
          ? "Hệ thống đã ghi nhận dấu hiệu khắc phục và cập nhật roadmap."
          : "Hệ thống đã cập nhật điểm yếu, roadmap và tạo bài trắc nghiệm ôn lại.",
        lessonTitle: lessonWeakness?.lesson?.title || currentLesson?.title || null,
        aiFeedback: lessonWeakness?.aiFeedback || null,
        reviewExerciseCount: Array.isArray(lessonWeakness?.reviewExercises) ? lessonWeakness.reviewExercises.length : 0,
        status: lessonWeakness?.status || null,
      });

      window.setTimeout(() => {
        setWeaknessPopup((current) => (current?.id === popupId ? null : current));
      }, 6_000);
    } catch (error) {
      console.error("Failed to record weakness signal:", error);
    }
  }, [currentLesson?.title]);

  const handleQuizAnswered = async (payload: QuizAnswerPayload) => {
    if (sending || !hasUnlockedChat) return;

    const quizReplyMessage = payload.isCorrect
      ? `Em chọn đáp án: ${payload.selectedOptionText}.`
      : `Em chọn đáp án: ${payload.selectedOptionText}. Chắc em đang hiểu sai chỗ này rồi.`;

    const userQuizMessage = {
      id: `${Date.now()}-quiz`,
      role: "user" as const,
      content: quizReplyMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userQuizMessage]);

    const followUpPrompt = payload.isCorrect
      ? `Học sinh vừa trả lời đúng câu trắc nghiệm.
Câu hỏi: ${payload.question}
Đáp án học sinh chọn: ${payload.selectedOptionText}
Giải thích của quiz: ${payload.explanation}

Hãy phản hồi như gia sư AI trong 2-4 câu: khen ngắn gọn, xác nhận tiến bộ, nếu phù hợp nhắc rằng làm tốt có thể được thưởng kim cương, rồi dẫn dắt sang câu hỏi hoặc bước học tiếp theo để cuộc chat tiếp tục tự nhiên.`
      : `Học sinh vừa trả lời sai câu trắc nghiệm.
Câu hỏi: ${payload.question}
Đáp án học sinh chọn: ${payload.selectedOptionText}
Đáp án đúng: ${payload.correctOptionText}
Giải thích của quiz: ${payload.explanation}

Hãy phản hồi như gia sư AI trong 3-5 câu: động viên, giải thích ngắn gọn vì sao đáp án đúng hợp lý, chỉ ra lỗi hiểu bài một cách nhẹ nhàng, rồi đặt một câu hỏi dễ hơn hoặc câu hỏi nối tiếp để cuộc chat tiếp tục tự nhiên.`;

    if (!payload.isCorrect) {
      void recordWeaknessSignal({
        topic: currentLesson?.title || subject?.name,
        question: payload.question,
        userAnswer: payload.selectedOptionText,
        correctAnswer: payload.correctOptionText,
        reason: `Trả lời sai quiz: chọn ${payload.selectedOptionText}, đáp án đúng là ${payload.correctOptionText}`,
        source: "QUIZ",
        isResolved: false,
        lessonId: params.lessonId,
      });
    } else {
      void recordWeaknessSignal({
        topic: currentLesson?.title || subject?.name,
        question: payload.question,
        userAnswer: payload.selectedOptionText,
        correctAnswer: payload.correctOptionText,
        reason: "Trả lời đúng câu trắc nghiệm trong AI chat, ghi nhận khả năng đã khắc phục điểm yếu liên quan",
        source: "QUIZ",
        isResolved: true,
        score: 100,
        lessonId: params.lessonId,
      });
    }

    setSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user",
              content: quizReplyMessage,
            },
            {
              role: "user",
              content: followUpPrompt,
            },
          ],
          lessonId: params.lessonId,
          subjectId: params.subjectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Quiz follow-up error:", error);
    } finally {
      setSending(false);
    }
  };

  // Exercise state
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<{
    id: string;
    question: string;
  } | null>(null);

  useEffect(() => {
    if (!pdfUrl || totalPdfPages === 0) return;

    const timer = window.setInterval(() => {
      setPageReadSeconds((prev) => ({
        ...prev,
        [currentPdfPage]: (prev[currentPdfPage] || 0) + 1,
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [pdfUrl, currentPdfPage, totalPdfPages]);

  const totalReadSeconds = Object.values(pageReadSeconds).reduce((sum, seconds) => sum + seconds, 0);
  const currentPageReadSeconds = pageReadSeconds[currentPdfPage] || 0;
  const hasUnlockedChat = !pdfUrl || hasExistingChatHistory || messages.length > 0 || totalReadSeconds >= MAX_TOTAL_READ_SECONDS;
  const remainingReadSeconds = Math.max(0, MAX_TOTAL_READ_SECONDS - totalReadSeconds);

  const scrollToLatestMessage = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scroll = (scrollBehavior: ScrollBehavior) => {
      const container = messagesContainerRef.current;

      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: scrollBehavior });
        return;
      }

      messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior, block: "end" });
    };

    window.requestAnimationFrame(() => {
      scroll(behavior);
      window.requestAnimationFrame(() => scroll("auto"));
    });

    window.setTimeout(() => scroll("auto"), 120);
  }, []);

  useEffect(() => {
    scrollToLatestMessage(messages.length > 1 ? "smooth" : "auto");
  }, [messages.length, sending, isStarting, scrollToLatestMessage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const startStudySession = useCallback(async () => {
    if (loading || !user?.id || studyStartedRef.current) return true;

    studyStartedRef.current = true;

    try {
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: params.lessonId }),
      });

      if (!response.ok) {
        studyStartedRef.current = false;
        return false;
      }

      const session = await response.json();
      studySessionIdRef.current = session.id;
      if (typeof session.streakDays === "number") {
        setUser({
          ...user,
          profile: user.profile
            ? { ...user.profile, streakDays: session.streakDays }
            : user.profile,
        });
        window.dispatchEvent(new CustomEvent("study-progress-updated", {
          detail: { streakDays: session.streakDays },
        }));
      }
      setStudySessionActive(true);
      setStudyTimeSeconds(0);
      return true;
    } catch (error) {
      studyStartedRef.current = false;
      console.error("Failed to start study session:", error);
      return false;
    }
  }, [loading, params.lessonId, setUser, user]);

  useEffect(() => {
    if (loading || !user?.id || studySessionActive) return;
    startStudySession();
  }, [loading, user?.id, studySessionActive, startStudySession]);

  useEffect(() => {
    if (!studySessionActive || !studySessionIdRef.current) return;

    const timer = window.setInterval(() => {
      studyUnsyncedSecondsRef.current += 1;
      setStudyTimeSeconds((prev) => prev + 1);

      if (studyUnsyncedSecondsRef.current < STUDY_PING_SECONDS) {
        return;
      }

      const seconds = studyUnsyncedSecondsRef.current;
      studyUnsyncedSecondsRef.current = 0;

      fetch(`/api/study-sessions/${studySessionIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
      }).catch((error) => {
        console.error("Failed to ping study session:", error);
        studyUnsyncedSecondsRef.current += seconds;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [studySessionActive]);

  useEffect(() => {
    const flushStudyTime = (ended = false) => {
      const sessionId = studySessionIdRef.current;
      const seconds = studyUnsyncedSecondsRef.current;

      if (!sessionId) return;

      studyUnsyncedSecondsRef.current = 0;

      const payload = JSON.stringify({ seconds, ended });

      if (navigator.sendBeacon && ended) {
        navigator.sendBeacon(`/api/study-sessions/${sessionId}`, new Blob([payload], { type: "application/json" }));
        return;
      }

      fetch(`/api/study-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: ended,
      }).catch((error) => {
        console.error("Failed to flush study session:", error);
        studyUnsyncedSecondsRef.current += seconds;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushStudyTime(false);
      }
    };

    const handleBeforeUnload = () => {
      flushStudyTime(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushStudyTime(true);
    };
  }, []);

  const endStudySession = async () => {
    const sessionId = studySessionIdRef.current;
    if (!sessionId || isEndingLesson) return;

    setIsEndingLesson(true);

    try {
      const seconds = studyUnsyncedSecondsRef.current;
      studyUnsyncedSecondsRef.current = 0;

      await fetch(`/api/study-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, ended: true }),
      });

      studySessionIdRef.current = null;
      studyStartedRef.current = false;
      setStudySessionActive(false);
      setStudyTimeSeconds(0);
    } catch (error) {
      console.error("Failed to end study session:", error);
    } finally {
      setIsEndingLesson(false);
    }
  };

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;

    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setHasExistingChatHistory(false);

      const [courseResponse, lessonResponse, learningStateResponse] = await Promise.all([
        fetch(`/api/courses/${params.subjectId}`, { cache: "no-store" }),
        fetch(`/api/lessons/${params.lessonId}`, { cache: "no-store" }),
        fetch(`/api/learning-state?lessonId=${params.lessonId}`, { cache: "no-store" }),
      ]);

      if (courseResponse.ok) {
        const data = await courseResponse.json();
        setSubject(data);

        const lesson = (data.lessons || []).find(
          (l: LessonItem) => l.id === params.lessonId
        );

        setCurrentLesson(lesson || null);
      }

      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();

        if (lessonData.pdfUrl) {
          setPdfUrl(lessonData.pdfUrl);
        } else {
          const pdfMatch = lessonData.content?.match(/\[.*?\]\((.*?\.pdf)\)/);
          setPdfUrl(pdfMatch ? pdfMatch[1] : null);
        }
      } else {
        setPdfUrl(null);
      }

      if (learningStateResponse.ok) {
        const learningState = await learningStateResponse.json();
        const progress = learningState.progress;
        const conversation = learningState.conversation;

        if (progress?.lastPage) {
          setInitialPdfPage(progress.lastPage);
          setCurrentPdfPage(progress.lastPage);
        } else {
          setInitialPdfPage(1);
          setCurrentPdfPage(1);
        }

        if (typeof progress?.totalStudySec === "number") {
          setStudyTimeSeconds(progress.totalStudySec);
        }

        if (conversation?.id) {
          const loadedMessages = (conversation.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp || Date.now()),
          }));

          activeConversationIdRef.current = conversation.id;
          setMessages(loadedMessages);
          setHasExistingChatHistory(loadedMessages.length > 0);
        } else {
          activeConversationIdRef.current = null;
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      if (isSilent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [params.lessonId, params.subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const saveHistory = async () => {
        const sanitizedMessages = toChatHistoryMessages(messages);

        if (sanitizedMessages.length === 0) {
          return;
        }

        try {
          const response = await fetch("/api/chat-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId: params.lessonId,
              conversationId: activeConversationIdRef.current ?? undefined,
              messages: sanitizedMessages,
            }),
          });

          if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            console.error("Failed to save chat history:", response.status, errorPayload);
            return;
          }

          const data = await response.json();
          if (data?.id) {
            activeConversationIdRef.current = data.id;
          }
        } catch (error) {
          console.error("Failed to save chat history:", error);
        }
      };

      const timer = setTimeout(saveHistory, 2000); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [messages, params.lessonId]);

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim()) return;
    if (!hasUnlockedChat) return;

    // If we are currently in an exercise, call grade-exercise instead
    if (currentExercise && !overrideInput) {
      await handleGradeExercise(messageContent);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideInput) setInput("");
    setSending(true);

    try {
      const updatedMessages = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: messageContent },
      ];

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          lessonId: params.lessonId,
          subjectId: params.subjectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setSending(false);
    }
  };

  const insertMathSymbol = (value: string) => {
    const textarea = inputRef.current;

    if (!textarea) {
      setInput((prev) => `${prev}${value}`);
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const nextValue = `${input.slice(0, selectionStart)}${value}${input.slice(selectionEnd)}`;

    setInput(nextValue);

    window.requestAnimationFrame(() => {
      const nextCursor = selectionStart + value.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleNewChat = async () => {
    if (sending || isStarting || !hasUnlockedChat) return;

    setIsStarting(true);
    setInput("");
    setCurrentExercise(null);
    setMessages([]);

    try {
      await fetch("/api/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: params.lessonId,
          conversationId: activeConversationIdRef.current,
          messages: [],
        }),
      }).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          activeConversationIdRef.current = data.id;
        }
      });

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Chào bạn, mình bắt đầu học bài này nhé. Hãy tóm tắt sơ lược nội dung bài học này giúp mình với!",
            },
          ],
          lessonId: params.lessonId,
          subjectId: params.subjectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("New chat error:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartChat = async () => {
    const started = await startStudySession();
    if (!started) return;
    await handleNewChat();
  };

  const handleEndLesson = async () => {
    if (isEndingLesson) return;

    const sessionId = studySessionIdRef.current;
    const seconds = studyUnsyncedSecondsRef.current;
    studyUnsyncedSecondsRef.current = 0;
    setIsEndingLesson(true);

    try {
      if (sessionId) {
        await fetch(`/api/study-sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds, ended: true }),
        });
      }

      const response = await fetch(`/api/lessons/${params.lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: 0 }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete lesson (${response.status})`);
      }

      const data = await response.json();
      studySessionIdRef.current = null;
      studyStartedRef.current = false;
      setStudySessionActive(false);
      setStudyTimeSeconds(0);
      setCompletionResult(null);
      setCompletionAnswers({});
      setCompletionQuiz(data.quiz || null);

      if (!data.quiz) {
        router.push(`/courses/${params.subjectId}`);
      }
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      studyUnsyncedSecondsRef.current += seconds;
    } finally {
      setIsEndingLesson(false);
    }
  };

  const handleSubmitCompletionQuiz = async () => {
    if (!completionQuiz || isSubmittingCompletionQuiz) return;

    setIsSubmittingCompletionQuiz(true);
    try {
      const response = await fetch(`/api/lessons/${params.lessonId}/completion-quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: completionQuiz.id,
          answers: completionAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit completion quiz (${response.status})`);
      }

      const result = await response.json();
      setCompletionResult(result);
    } catch (error) {
      console.error("Failed to submit completion quiz:", error);
    } finally {
      setIsSubmittingCompletionQuiz(false);
    }
  };

  const handleGenerateExercise = async () => {
    setIsGeneratingExercise(true);
    try {
      const response = await fetch("/api/ai/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: params.lessonId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentExercise({
          id: data.id || Date.now().toString(),
          question: data.question,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `### 📝 Bài tập trắc nghiệm ngẫu nhiên dành cho bạn:\n\n${data.question}\n\n*Chọn đáp án đúng rồi gửi câu trả lời của bạn vào ô bên dưới nhé!*`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to generate exercise:", error);
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  const handleGradeExercise = async (userAnswer: string) => {
    if (!currentExercise) return;

    setSending(true);
    setInput("");
    
    // Add user's answer to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: userAnswer,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/ai/grade-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: params.lessonId,
          question: currentExercise.question,
          userAnswer: userAnswer,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (typeof data.score === "number" && data.score < 80) {
          void recordWeaknessSignal({
            topic: currentLesson?.title || subject?.name,
            question: currentExercise.question,
            userAnswer,
            reason: `Bài tập tự luận có điểm ${data.score}/100, cần ôn tập thêm`,
            source: "EXERCISE",
            isResolved: false,
            score: data.score,
            lessonId: params.lessonId,
          });
        } else if (typeof data.score === "number" && data.score >= 80) {
          void recordWeaknessSignal({
            topic: currentLesson?.title || subject?.name,
            question: currentExercise.question,
            userAnswer,
            reason: `Bài tập tự luận đạt ${data.score}/100, ghi nhận điểm yếu liên quan đã được cải thiện`,
            source: "EXERCISE",
            isResolved: true,
            score: data.score,
            lessonId: params.lessonId,
          });
        }

        let feedbackContent = `### 📊 Kết quả bài làm:\n\n**Điểm số:** ${data.score}/10\n\n${data.feedback}`;
        
        if (data.diamondsEarned > 0) {
          feedbackContent += `\n\n🎉 **Chúc mừng! Bạn đã nhận được ${data.diamondsEarned} kim cương!**`;
          // Update user state with new diamonds if available in auth store
          if (user) {
            setUser({
              ...user,
              diamonds: (user.diamonds || 0) + data.diamondsEarned,
            });
          }
        } else if (data.score >= 80) {
          // If the AI didn't return diamondsEarned but score is high, match the prompt logic
          const earned = 10;
          feedbackContent += `\n\n🎉 **Chúc mừng! Bạn đã nhận được ${earned} kim cương!**`;
          if (user) {
            setUser({
              ...user,
              diamonds: (user.diamonds || 0) + earned,
            });
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: feedbackContent,
            timestamp: new Date(),
          },
        ]);
        
        setCurrentExercise(null);
      }
    } catch (error) {
      console.error("Failed to grade exercise:", error);
    } finally {
      setSending(false);
    }
  };

  const filteredLessons = () => {
    const allLessons = subject?.lessons || [];
    if (activeFilter === "all") return allLessons;
    return allLessons.filter((lesson) => {
      if (activeFilter === "file") return lesson.hasPdf || lesson.hasVideo;
      if (activeFilter === "question") return lesson.hasQuiz;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-paper-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <span className="text-sm text-slate-500">Đang tải nội dung...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[linear-gradient(180deg,#fffefb_0%,#f8f4eb_58%,#f3ecde_100%)] flex flex-col overflow-hidden">
      {weaknessPopup && (
        <div className="fixed right-4 top-24 z-[60] w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-right-4 duration-300">
          <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl shadow-rose-950/10">
            <div className="flex items-start gap-3 border-b border-rose-50 bg-rose-50/80 px-4 py-3">
              <div className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                weaknessPopup.status === "REMEDIATED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
              )}>
                {weaknessPopup.status === "REMEDIATED" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{weaknessPopup.title}</p>
                <p className="mt-1 text-xs text-slate-600">{weaknessPopup.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setWeaknessPopup(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Đóng thông báo điểm yếu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              {weaknessPopup.lessonTitle && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Phần bài học liên quan</p>
                  <p className="mt-1 font-medium text-slate-900">{weaknessPopup.lessonTitle}</p>
                </div>
              )}
              {weaknessPopup.aiFeedback && (
                <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-cyan-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Nhận xét AI</p>
                  <p className="mt-1 text-xs leading-5">{weaknessPopup.aiFeedback}</p>
                </div>
              )}
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Đã tạo {weaknessPopup.reviewExerciseCount} bài tập trắc nghiệm để ôn lại trong mục Điểm yếu.
              </div>
            </div>
          </div>
        </div>
      )}

      {completionQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-900/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-3xl rounded-[28px] border border-white/80 bg-white p-5 shadow-panel sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-paper-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Đánh giá cuối phiên</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink-900">Kiểm tra ghi nhớ bài học</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Bài học đã được lưu là hoàn thành. Trả lời nhanh vài câu để hệ thống cập nhật roadmap và điểm yếu chính xác hơn.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/courses/${params.subjectId}`)}
                className="text-slate-500 hover:text-slate-900"
                title="Đóng đánh giá"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              {completionQuiz.questions.map((question, questionIndex) => {
                const result = completionResult?.results.find((item) => item.questionId === question.id);

                return (
                  <div key={question.id} className="rounded-3xl border border-paper-200 bg-paper-50/70 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                        {questionIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-ink-900">{question.question}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {question.options.map((option) => {
                            const isSelected = completionAnswers[question.id] === option.id;
                            const isCorrectAfterSubmit = result?.correctOptionText === option.text;
                            const isWrongSelection = result && isSelected && !result.isCorrect;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={Boolean(completionResult)}
                                onClick={() => setCompletionAnswers((current) => ({ ...current, [question.id]: option.id }))}
                                className={cn(
                                  "rounded-2xl border px-3 py-2 text-left text-sm transition-all",
                                  isCorrectAfterSubmit
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : isWrongSelection
                                      ? "border-red-300 bg-red-50 text-red-700"
                                      : isSelected
                                        ? "border-brand-400 bg-brand-50 text-brand-800"
                                        : "border-paper-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/60",
                                )}
                              >
                                {option.text}
                              </button>
                            );
                          })}
                        </div>

                        {result && (
                          <div className={cn(
                            "mt-3 rounded-2xl border px-3 py-2 text-sm",
                            result.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800",
                          )}>
                            <p className="font-semibold">{result.isCorrect ? "Đúng" : "Cần ôn lại"}</p>
                            <p className="mt-1">Đáp án đúng: {result.correctOptionText}</p>
                            {result.explanation && <p className="mt-1">{result.explanation}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-paper-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {completionResult ? (
                <div>
                  <p className="text-lg font-semibold text-ink-900">
                    Kết quả: {completionResult.score}/{completionResult.totalQuestions} câu đúng ({completionResult.percentage}%)
                  </p>
                  <p className="text-sm text-slate-600">Roadmap và điểm yếu đã được cập nhật từ kết quả này.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Đã chọn {Object.keys(completionAnswers).length}/{completionQuiz.questions.length} câu.
                </p>
              )}

              <div className="flex gap-2">
                {completionResult ? (
                  <Button onClick={() => router.push(`/courses/${params.subjectId}`)} className="bg-ink-900 text-white hover:bg-ink-800">
                    Về danh sách bài học
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitCompletionQuiz}
                    disabled={isSubmittingCompletionQuiz || Object.keys(completionAnswers).length < completionQuiz.questions.length}
                    className="bg-ink-900 text-white hover:bg-ink-800"
                  >
                    {isSubmittingCompletionQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Nộp đánh giá
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline navigation - no header */}
      <div className="h-12 bg-white/90 border-b border-white/80 px-4 flex items-center justify-between shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-900">
            {subject?.name || "Môn học"}
          </span>
        </div>

        {/* User Stats / Diamonds */}
        <div className="flex items-center gap-3">
          {studySessionActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">{formatTime(studyTimeSeconds)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-50 rounded-full border border-accent-100">
            <Gem className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">{user?.diamonds || 0}</span>
          </div>
          {studySessionActive && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleEndLesson}
              disabled={isEndingLesson}
            >
              {isEndingLesson ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Kết thúc học
            </Button>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex flex-col overflow-auto lg:flex-row lg:overflow-hidden">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className="max-h-64 w-full shrink-0 border-b border-white/80 bg-white/88 backdrop-blur-sm lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r lg:flex lg:flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Danh sách tiết học
            </h2>

            <Button
              variant="outline"
              className="w-full h-8 gap-2 text-xs border-brand-200 bg-ink-900 text-white hover:bg-ink-800"
              onClick={() => loadData({ silent: true })}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Đang tải lại..." : "Tải lại danh sách"}
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 flex gap-1">
            {(["all", "file", "question"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  "px-3 py-1 text-[10px] font-medium rounded transition-all",
                  activeFilter === tab
                    ? "bg-brand-500 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab === "all" ? "Tất cả" : tab === "file" ? "File" : "Câu hỏi"}
              </button>
            ))}
          </div>

          {/* Lesson List */}
          <div className="max-h-40 space-y-2 overflow-y-auto p-3 lg:max-h-none lg:flex-1">
            {filteredLessons().map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() =>
                    router.push(`/courses/${params.subjectId}/${lesson.id}`)
                  }
                  className={cn(
                    "p-3 border transition-all cursor-pointer",
                    lesson.id === params.lessonId
                      ? "border-brand-500 bg-brand-50"
                      : "border-paper-200 bg-white/90 hover:border-brand-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium",
                            lesson.id === params.lessonId
                              ? "bg-brand-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {lesson.order}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium truncate",
                            lesson.id === params.lessonId
                              ? "text-brand-700"
                              : "text-slate-700"
                          )}
                        >
                          {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 ml-8 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.duration} phút</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ==================== CENTER CONTENT ==================== */}
        <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden bg-paper-50/40 lg:min-h-0">
          <div className="flex-1 overflow-auto p-3 lg:p-4">
            <section className="mb-4 overflow-hidden rounded-[28px] border border-amber-200/70 bg-[radial-gradient(circle_at_top_left,#fff7d6_0%,#ffffff_42%,#eefcff_100%)] shadow-soft">
              <div className="border-b border-amber-100/80 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Dành cho ban giám khảo</p>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">Chỉ dẫn học tập từng bước</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Quy trình này mô tả cách học sinh sử dụng màn hình học tập từ lúc chọn bài đến khi lưu tiến độ.
                    </p>
                  </div>
                  <div className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700">
                    {learningGuideSteps.length} bước thao tác
                  </div>
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
                {learningGuideSteps.map((step, index) => (
                  <div key={step.title} className="group relative rounded-3xl border border-white/80 bg-white/86 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-sm font-bold text-white shadow-lg shadow-ink-900/15">
                        {index + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-xs leading-5 text-slate-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {pdfUrl ? (
              <div className="flex min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/96 shadow-soft lg:h-[calc(100%-14.5rem)]">
                <div className="flex items-center justify-between border-b border-paper-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Tài liệu học tập</h3>
                    <p className="text-xs text-slate-500">Xem trực tiếp trong trang hoặc mở riêng trong tab mới.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pdfUrl, "_blank")}
                    className="border-brand-200 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                  >
                    Mở tab mới
                  </Button>
                </div>
                <PDFViewer
                  url={pdfUrl}
                  initialPage={initialPdfPage}
                  onPageChange={(page, totalPages) => {
                    setCurrentPdfPage(page);
                    setTotalPdfPages(totalPages);

                    void fetch("/api/learning-state", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        lessonId: params.lessonId,
                        page,
                        totalPages,
                      }),
                    }).catch((error) => {
                      console.error("Failed to update learning state:", error);
                    });
                  }}
                />
              </div>
            ) : (
              <div className="min-h-[420px] bg-white/96 border-dashed border-paper-300 rounded-[28px] flex flex-col items-center justify-center shadow-soft">
                <div className="w-16 h-16 bg-paper-50 flex items-center justify-center mb-4 rounded-full">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-700 mb-2">
                  Tài liệu học tập
                </h3>
                <p className="text-sm text-slate-500">
                  Không có tài liệu PDF cho bài học này
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT CHAT PANEL ==================== */}
        <div className="min-h-[520px] w-full shrink-0 border-t border-white/80 bg-white/92 backdrop-blur-sm lg:min-h-0 lg:w-80 lg:border-l lg:border-t-0 lg:flex lg:flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">AI Tutor</p>
                <p className="text-[10px] text-emerald-500">
                  {studySessionActive ? "Đang học" : "Sẵn sàng"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                onClick={handleNewChat}
                disabled={sending || isStarting || !hasUnlockedChat}
                title="Tạo đoạn chat mới"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <History className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper-50/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-brand-500 animate-pulse" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Sẵn sàng học chưa?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Bắt đầu trò chuyện với AI Tutor để cùng nhau khám phá bài học này nhé!
                </p>
                <Button 
                  onClick={handleStartChat}
                  disabled={isStarting || !hasUnlockedChat}
                  className="bg-ink-900 hover:bg-ink-800 text-white gap-2 px-6"
                >
                  {isStarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Bắt đầu học ngay
                </Button>
              </div>
            ) : (
              messages.map((msg) => {
                const assistantVariant = msg.role === "assistant" ? getAssistantMessageVariant(msg.content) : null;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                        msg.role === "user"
                          ? "text-brand-500"
                          : assistantVariant === "question"
                            ? "text-amber-600"
                            : "text-sky-600"
                      )}
                    >
                      {msg.role === "user"
                        ? "Cau hoi"
                        : assistantVariant === "question"
                          ? "AI Dat cau hoi"
                          : "AI Giai thich"}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        msg.role === "user"
                          ? "bg-brand-500 text-white prose-invert"
                          : assistantVariant === "question"
                            ? "border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white text-amber-950 ring-1 ring-amber-100"
                            : "border border-sky-200 bg-gradient-to-br from-sky-50 via-cyan-50 to-white text-slate-800 ring-1 ring-sky-100"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <MarkdownMessage 
                          content={msg.content} 
                          onQuizCorrect={handleQuizCorrect}
                          onQuizAnswered={handleQuizAnswered}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {msg.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* System Notice */}
          <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 space-y-2">
            {!hasUnlockedChat && pdfUrl && (
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Cần đọc tài liệu trước khi chat với AI</p>
                <p className="mt-1">
                  Hãy đọc thêm <strong>{remainingReadSeconds}s</strong> để mở chat. Tổng thời gian hiện tại là <strong>{totalReadSeconds}s / {MAX_TOTAL_READ_SECONDS}s</strong>.
                </p>
              </div>
            )}
            <p className="text-[10px] text-amber-700">
              Chatbot có thể đưa ra thông tin không chính xác.
            </p>
          </div>

          {/* Input Area - Only shown after starting chat */}
          {messages.length > 0 && (
            <div className="p-4 border-t border-paper-200 bg-white/96 animate-in slide-in-from-bottom-4 duration-300">
              {/* Mode Toggle & AI Exercise Button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatMode("text")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded transition-all",
                      chatMode === "text"
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setChatMode("math")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded transition-all",
                      chatMode === "math"
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Math
                  </button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateExercise}
                  disabled={isGeneratingExercise || !!currentExercise || !hasUnlockedChat}
                  className={cn(
                    "h-8 gap-2 text-xs border-brand-200 text-brand-700 hover:bg-brand-50 hover:text-brand-800",
                    !!currentExercise && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isGeneratingExercise ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {currentExercise ? "Đang làm bài tập" : "Tạo trắc nghiệm AI"}
                </Button>
              </div>

              {chatMode === "math" && (
                <div className="mb-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-brand-800">Ky hieu toan hoc</p>
                    <p className="text-[10px] text-brand-700/80">Cham de chen vao vi tri con tro</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mathSymbols.map((symbol) => (
                      <button
                        key={symbol.label}
                        type="button"
                        onClick={() => insertMathSymbol(symbol.value)}
                        className="rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 transition-colors hover:bg-brand-100"
                      >
                        {symbol.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Field */}
              <div className="relative flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  placeholder={
                    !hasUnlockedChat
                      ? `Đọc thêm ${remainingReadSeconds}s để mở chat AI...`
                      : currentExercise
                        ? "Nhập câu trả lời của bạn..."
                        : chatMode === "math"
                          ? "Nhập biểu thức, công thức hoặc câu hỏi toán học..."
                          : "Nhập tin nhắn..."
                  }
                  className={cn(
                    "flex-1 bg-paper-50 border border-paper-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-500 min-h-[80px]",
                    currentExercise && "border-brand-300 ring-1 ring-brand-100"
                  )}
                  value={input}
                  disabled={!hasUnlockedChat}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-brand-500 hover:bg-brand-600"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending || !hasUnlockedChat}
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
              {currentExercise && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-brand-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Bạn đang trả lời bài tập AI. Trả lời đúng để nhận kim cương!
                  </p>
                  <button 
                    onClick={() => setCurrentExercise(null)}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
