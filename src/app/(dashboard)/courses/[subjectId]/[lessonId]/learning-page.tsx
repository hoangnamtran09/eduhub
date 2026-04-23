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
  Trophy,
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

type FilterTab = "all" | "file" | "link" | "question";

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
  const [pageReadSeconds, setPageReadSeconds] = useState<Record<number, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const studySessionIdRef = useRef<string | null>(null);
  const studyUnsyncedSecondsRef = useRef(0);
  const studyStartedRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingLesson, setIsEndingLesson] = useState(false);
  const [studySessionActive, setStudySessionActive] = useState(false);
  const [chatMode, setChatMode] = useState<"text" | "math">("text");
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);

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
          userId: user.id,
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
  const hasUnlockedChat = !pdfUrl || totalReadSeconds >= MAX_TOTAL_READ_SECONDS;
  const remainingReadSeconds = Math.max(0, MAX_TOTAL_READ_SECONDS - totalReadSeconds);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, isStarting]);

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
      setStudySessionActive(true);
      setStudyTimeSeconds(0);
      return true;
    } catch (error) {
      studyStartedRef.current = false;
      console.error("Failed to start study session:", error);
      return false;
    }
  }, [loading, params.lessonId, user?.id]);

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
      const response = await fetch(`/api/courses/${params.subjectId}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setSubject(data);

        const lesson = (data.lessons || []).find(
          (l: LessonItem) => l.id === params.lessonId
        );

        setCurrentLesson(lesson || null);
      }

      const lessonResponse = await fetch(`/api/lessons/${params.lessonId}`, {
        cache: "no-store",
      });

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

      const chatResponse = await fetch(`/api/chat-history?lessonId=${params.lessonId}`, {
        cache: "no-store",
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        if (chatData.length > 0) {
          const latestHistory = chatData[chatData.length - 1];
          if (latestHistory.messages) {
            setMessages(latestHistory.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp || Date.now())
            })));
          }
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
        try {
          await fetch("/api/chat-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId: params.lessonId,
              messages: messages
            }),
          });
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
          messages: [],
        }),
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
    await endStudySession();
    router.push(`/courses/${params.subjectId}`);
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
            content: `### 📝 Bài tập dành cho bạn:\n\n${data.question}\n\n*Hãy nhập câu trả lời của bạn vào ô bên dưới nhé!*`,
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
          userId: user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
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
          <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 rounded-full border border-brand-100">
            <Trophy className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-brand-700">Cấp 1</span>
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
      <div className="flex-1 flex overflow-hidden">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className="w-72 bg-white/88 border-r border-white/80 flex flex-col shrink-0 backdrop-blur-sm">
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
            {(["all", "file", "link", "question"] as FilterTab[]).map((tab) => (
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
                {tab === "all" ? "Tất cả" : tab === "file" ? "File" : tab === "link" ? "Link" : "Câu hỏi"}
              </button>
            ))}
          </div>

          {/* Lesson List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
        <div className="flex-1 flex flex-col bg-paper-50/40 overflow-hidden">
          <div className="flex-1 p-3 lg:p-4 overflow-auto">
            {pdfUrl ? (
              <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/96 shadow-soft">
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
                  onPageChange={(page, totalPages) => {
                    setCurrentPdfPage(page);
                    setTotalPdfPages(totalPages);
                  }}
                />
              </div>
            ) : (
              <div className="h-full bg-white/96 border-dashed border-paper-300 rounded-[28px] flex flex-col items-center justify-center shadow-soft">
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
        <div className="w-80 bg-white/92 border-l border-white/80 flex flex-col shrink-0 backdrop-blur-sm">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper-50/50">
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
                {!hasUnlockedChat && pdfUrl && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
                    <p className="font-semibold">Cần đọc tài liệu trước khi chat với AI</p>
                    <p className="mt-1">
                      Bạn cần đọc tổng cộng tối đa <strong>{MAX_TOTAL_READ_SECONDS} giây</strong> để mở chat. Hiện đang ở trang {currentPdfPage}
                      {totalPdfPages > 0 ? ` / ${totalPdfPages}` : ""} và đã đọc trang này {currentPageReadSeconds}s.
                    </p>
                    <p className="mt-1">Thời gian còn thiếu để mở chat: <strong>{remainingReadSeconds}s</strong>.</p>
                    <p className="mt-1 text-xs text-amber-700/80">Tổng thời gian đã đọc: <strong>{totalReadSeconds}s / {MAX_TOTAL_READ_SECONDS}s</strong>.</p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 text-sm prose prose-slate prose-sm",
                      msg.role === "user"
                        ? "bg-brand-500 text-white"
                        : "bg-white border border-paper-200 text-slate-700"
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
              ))
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
                  {currentExercise ? "Đang làm bài tập" : "Tạo bài tập AI"}
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
