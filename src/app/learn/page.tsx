"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/pdf-viewer";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  ArrowLeft,
  Send,
  BookOpen,
  RefreshCw,
  FileText,
  Eye,
  QrCode,
  Plus,
  History,
  X,
  Bold,
  Italic,
  Code,
  ImageIcon,
  Table,
  BarChart3,
  Trash2,
  ChevronDown,
  Clock,
  Sparkles,
  Loader2,
  Gem,
} from "lucide-react";
import dynamic from "next/dynamic";

const MarkdownMessage = dynamic(() => import("@/components/ai/MarkdownMessage"), { ssr: false });

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

export default function LearnPage({
  searchParams,
}: {
  searchParams: { subjectId: string; lessonId: string };
}) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonItem | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<"text" | "math">("text");

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const handleQuizCorrect = async () => {
    if (!user) return;
    const diamondAward = 2;
    try {
      const response = await fetch("/api/ai/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: diamondAward }),
      });
      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, diamonds: data.diamonds });
      }
    } catch (error) {
      console.error("Failed to update diamonds:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${searchParams.subjectId}`);
        if (response.ok) {
          const data = await response.json();
          setSubject(data);

          const lesson = (data.lessons || []).find(
            (l: LessonItem) => l.id === searchParams.lessonId
          );
          if (lesson) {
            setCurrentLesson(lesson);
          }
        }

        const lessonResponse = await fetch(`/api/lessons/${searchParams.lessonId}`);
        if (lessonResponse.ok) {
          const lessonData = await lessonResponse.json();
          if (lessonData.pdfUrl) {
            setPdfUrl(lessonData.pdfUrl);
          } else {
            const pdfMatch = lessonData.content?.match(/\[.*?\]\((.*?\.pdf)\)/);
            if (pdfMatch) {
              setPdfUrl(pdfMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams.subjectId, searchParams.lessonId]);

  useEffect(() => {
    if (!loading && currentLesson && subject && messages.length === 0) {
      setSending(true);
      (async () => {
        try {
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `Chào bạn! Hãy tóm tắt bài học hôm nay và giới thiệu ngắn gọn cho học sinh.`,
                },
              ],
              lessonId: currentLesson.id,
              subjectId: subject.id,
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
          console.error("Greeting error:", error);
        } finally {
          setSending(false);
        }
      })();
    }
  }, [loading, currentLesson?.id, subject?.id, messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          lessonId: searchParams.lessonId,
          subjectId: searchParams.subjectId,
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
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Đang tải nội dung...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-semibold text-slate-900">
                Tiết học
              </h2>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 mb-3">
              <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {currentLesson?.title || "Chọn bài học"}
                </p>
                <p className="text-xs text-slate-500">{subject?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <Button
              variant="outline"
              className="w-full h-9 gap-2 text-sm border-slate-200 bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </Button>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex gap-1">
            {(["all", "file", "link", "question"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-all",
                  activeFilter === tab
                    ? "bg-blue-500 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab === "all" ? "Tất cả" : tab === "file" ? "File" : tab === "link" ? "Link" : "Câu hỏi"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredLessons().map((lesson) => (
              <div
                key={lesson.id}
                onClick={() =>
                  router.push(`/learn?subjectId=${searchParams.subjectId}&lessonId=${lesson.id}`)
                }
                className={cn(
                  "p-3 border transition-all cursor-pointer",
                  lesson.id === searchParams.lessonId
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-7 h-7 rounded flex items-center justify-center text-xs font-medium",
                          lesson.id === searchParams.lessonId
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {lesson.order}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          lesson.id === searchParams.lessonId
                            ? "text-blue-600"
                            : "text-slate-700"
                        )}
                      >
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 ml-9 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lesson.duration} phút</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          <div className="p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-600">FILE</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600">PDF</span>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                <Gem className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-700">{user?.diamonds || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {currentLesson?.title || "Bài học"}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {currentLesson?.duration || 45} phút • Bài {currentLesson?.order || 1}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-sm border-slate-200"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {showPreview && pdfUrl ? (
              <div className="h-full bg-white border border-slate-200 overflow-hidden">
                <PDFViewer url={pdfUrl} />
              </div>
            ) : (
              <div className="h-full bg-white border-dashed border-slate-300 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">Xem trước tài liệu</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 text-sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4" />
                  Xem Preview
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT PANEL */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Tutor</p>
                <p className="text-xs text-emerald-500">Trực tuyến</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <History className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm text-slate-500">Đang chuẩn bị bài học...</p>
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
                      "max-w-[85%] px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownMessage content={msg.content} onQuizCorrect={handleQuizCorrect} />
                    ) : (
                      <span style={{whiteSpace: 'pre-line'}}>{msg.content}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-1">
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
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative flex items-end gap-2">
              <textarea
                placeholder="Nhập câu trả lời..."
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 min-h-[80px]"
                value={input}
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
                className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600"
                onClick={handleSend}
                disabled={!input.trim() || sending}
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
