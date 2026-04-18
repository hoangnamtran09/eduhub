"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/pdf-viewer";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import {
  ArrowLeft,
  Send,
  BookOpen,
  RefreshCw,
  FileText,
  Eye,
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

interface Semester {
  id: string;
  name: string;
  lessons: LessonItem[];
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  semesters: Semester[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type FilterTab = "all" | "file" | "link" | "question";

export default function LearningPage({
  params,
}: {
  params: { subjectId: string; lessonId: string };
}) {
  const router = useRouter();
  const { setCollapsed } = useSidebarStore();
  const [loading, setLoading] = useState(true);

  // Collapse sidebar to maximize content area when entering learning page
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonItem | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<"text" | "math">("text");

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${params.subjectId}`);
        if (response.ok) {
          const data = await response.json();
          setSubject(data);

          for (const semester of data.semesters || []) {
            const lesson = semester.lessons.find(
              (l: LessonItem) => l.id === params.lessonId
            );
            if (lesson) {
              setCurrentLesson(lesson);
              break;
            }
          }
        }

        const lessonResponse = await fetch(`/api/lessons/${params.lessonId}`);
        if (lessonResponse.ok) {
          const lessonData = await lessonResponse.json();
          // Check direct pdfUrl field first
          if (lessonData.pdfUrl) {
            setPdfUrl(lessonData.pdfUrl);
          } else {
            // Fallback: extract from content markdown
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
  }, [params.subjectId, params.lessonId]);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          lessonId: params.lessonId,
          model: "glm-4-flash",
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

  const filteredLessons = (semester: Semester) => {
    if (activeFilter === "all") return semester.lessons;
    return semester.lessons.filter((lesson) => {
      if (activeFilter === "file") return lesson.hasPdf || lesson.hasVideo;
      if (activeFilter === "question") return lesson.hasQuiz;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Đang tải nội dung...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Inline navigation - no header */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
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

      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Danh sách tiết học
            </h2>

            {/* Subject Dropdown */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 mb-3">
              <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {currentLesson?.title || "Chọn bài học"}
                </p>
                <p className="text-[10px] text-slate-500">{subject?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <Button
              variant="outline"
              className="w-full h-8 gap-2 text-xs border-slate-200 bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải lại danh sách
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
                    ? "bg-blue-500 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab === "all" ? "Tất cả" : tab === "file" ? "File" : tab === "link" ? "Link" : "Câu hỏi"}
              </button>
            ))}
          </div>

          {/* Lesson List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {subject?.semesters?.map((semester) =>
              filteredLessons(semester).map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() =>
                    router.push(`/courses/${params.subjectId}/${lesson.id}`)
                  }
                  className={cn(
                    "p-3 border transition-all cursor-pointer",
                    lesson.id === params.lessonId
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium",
                            lesson.id === params.lessonId
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {lesson.order}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium truncate",
                            lesson.id === params.lessonId
                              ? "text-blue-600"
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
              ))
            )}
          </div>
        </div>

        {/* ==================== CENTER CONTENT ==================== */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Content Area - Tài liệu học tập */}
          <div className="flex-1 p-4 overflow-auto">
            {pdfUrl ? (
              <div className="h-full bg-white border border-slate-200 overflow-hidden">
                <PDFViewer url={pdfUrl} />
              </div>
            ) : (
              <div className="h-full bg-white border-dashed border-slate-300 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center mb-4">
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
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">AI Tutor</p>
                <p className="text-[10px] text-emerald-500">Trực tuyến</p>
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  Đang tải cuộc hội thoại gần nhất...
                </p>
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
                    {msg.content}
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
          </div>

          {/* System Notice */}
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
            <p className="text-[10px] text-amber-700">
              ⚠️ Chatbot có thể đưa ra thông tin không chính xác.
            </p>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setChatMode("text")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-all",
                  chatMode === "text"
                    ? "bg-blue-500 text-white"
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
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                Math
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-3 p-2 bg-slate-50 border border-slate-200">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <Bold className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <Italic className="w-3 h-3" />
              </Button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <Code className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <ImageIcon className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
                <Table className="w-3 h-3" />
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Input Field */}
            <div className="relative flex items-end gap-2">
              <textarea
                placeholder="Trả lời:"
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
