import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import InteractiveQuiz, { QuizAnswerPayload } from "./InteractiveQuiz";

interface MarkdownMessageProps {
  content: string;
  onQuizCorrect?: () => void;
  onQuizAnswered?: (payload: QuizAnswerPayload) => void;
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="mb-3 text-base font-bold tracking-tight text-current" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="mb-2 text-[15px] font-bold tracking-tight text-current" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="mb-2 text-sm font-semibold text-current" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-2 leading-6 text-current/95 last:mb-0" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="mb-2 ml-4 list-disc space-y-1 text-current/95" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="mb-2 ml-4 list-decimal space-y-1 text-current/95" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-current" {...props} />,
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="my-3 border-l-4 border-current/20 bg-white/50 px-3 py-2 italic text-current/80" {...props} />
  ),
  code: ({ inline, node, ...props }: any) =>
    inline ? (
      <code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.9em] text-current" {...props} />
    ) : (
      <code className="block overflow-x-auto rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-100" {...props} />
    ),
  hr: ({ node, ...props }: any) => <hr className="my-4 border-current/10" {...props} />,
  table: ({ node, ...props }: any) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-current/10 bg-white/70">
      <table className="min-w-full text-left text-xs" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => <th className="border-b border-current/10 px-3 py-2 font-semibold text-current" {...props} />,
  td: ({ node, ...props }: any) => <td className="border-b border-current/5 px-3 py-2 align-top text-current/90" {...props} />,
};

export default function MarkdownMessage({ content, onQuizCorrect, onQuizAnswered }: MarkdownMessageProps) {
  // Regex to find :::quiz {json} :::
  const quizRegex = /:::quiz\s*(\{[\s\S]*?\})\s*:::/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = quizRegex.exec(content)) !== null) {
    // Add text before the quiz
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add the quiz
    try {
      const quizData = JSON.parse(match[1]);
      parts.push({
        type: "quiz",
        data: quizData,
      });
    } catch (e) {
      console.error("Failed to parse quiz data:", e);
      parts.push({
        type: "text",
        content: match[0], // fallback to raw text if parse fails
      });
    }

    lastIndex = quizRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  // If no quiz blocks found, just render the whole thing as markdown
  if (parts.length === 0) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === "quiz") {
          return (
            <InteractiveQuiz 
              key={index} 
              data={part.data as any} 
              onCorrect={onQuizCorrect}
              onAnswered={onQuizAnswered}
            />
          );
        }
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {part.content as string}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
