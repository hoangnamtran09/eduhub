"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// @ts-ignore
import "katex/dist/katex.min.css";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizData {
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface QuizAnswerPayload {
  question: string;
  explanation: string;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
}

interface InteractiveQuizProps {
  data: QuizData;
  onCorrect?: () => void;
  onAnswered?: (payload: QuizAnswerPayload) => void;
}

const remarkMathOptions = { singleDollarTextMath: false };
const rehypeKatexOptions = { strict: false, throwOnError: false };

const vietnameseCharRegex = /[\u00C0-\u1EF9]/;

function normalizeMathText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function sanitizeMathContent(value: string) {
  return value.replace(/(\$\$)([\s\S]*?)(\$\$)|(\\\[)([\s\S]*?)(\\\])|(\\\()([\s\S]*?)(\\\))/g, (match) => {
    return vietnameseCharRegex.test(match) ? normalizeMathText(match) : match;
  });
}

export default function InteractiveQuiz({ data, onCorrect, onAnswered }: InteractiveQuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const safeQuestion = sanitizeMathContent(data.question);
  const safeExplanation = sanitizeMathContent(data.explanation);

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsSubmitted(true);

    const selected = data.options[index];
    const correct = data.options.find((option) => option.isCorrect);

    onAnswered?.({
      question: data.question,
      explanation: data.explanation,
      selectedOptionText: selected.text,
      correctOptionText: correct?.text || "",
      isCorrect: selected.isCorrect,
    });
    
    if (data.options[index].isCorrect && onCorrect) {
      onCorrect();
    }
  };

  const isCorrect = selectedOption !== null && data.options[selectedOption].isCorrect;

  return (
    <div className="my-4 border border-blue-50 rounded-xl overflow-hidden bg-white shadow-md w-full max-w-md mx-auto">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-semibold text-blue-700">Thử thách trắc nghiệm</span>
      </div>
      
      <div className="p-4">
        <div className="text-slate-800 font-medium mb-4 prose prose-slate prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[[remarkMath, remarkMathOptions]]} rehypePlugins={[[rehypeKatex, rehypeKatexOptions]]}>
            {safeQuestion}
          </ReactMarkdown>
        </div>
        
        <div className="space-y-2 mb-4">
          {data.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isSubmitted}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border transition-all text-sm",
                selectedOption === index
                  ? option.isCorrect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                    : "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                  : isSubmitted && option.isCorrect
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 prose prose-sm max-w-none text-inherit">
                  <ReactMarkdown remarkPlugins={[[remarkMath, remarkMathOptions]]} rehypePlugins={[[rehypeKatex, rehypeKatexOptions]]}>
                    {sanitizeMathContent(option.text)}
                  </ReactMarkdown>
                </div>
                {isSubmitted && option.isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                )}
                {isSubmitted && selectedOption === index && !option.isCorrect && (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))}
        </div>

        {isSubmitted && (
          <div className={cn(
            "mt-4 p-3 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
            isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          )}>
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs w-full">
              <p className="font-bold mb-1">
                {isCorrect ? "Chính xác! Bạn tuyệt vời quá." : "Chưa đúng rồi, đừng nản lòng nhé!"}
              </p>
              <div className="opacity-90 prose prose-sm max-w-none text-inherit">
                <ReactMarkdown remarkPlugins={[[remarkMath, remarkMathOptions]]} rehypePlugins={[[rehypeKatex, rehypeKatexOptions]]}>
                  {safeExplanation}
                </ReactMarkdown>
              </div>
              {isCorrect && (
                <p className="mt-2 font-bold text-amber-600 flex items-center gap-1">
                   💎 +2 Kim cương
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
