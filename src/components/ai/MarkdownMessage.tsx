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
        components={{
          table: ({node, ...props}) => (
            <div style={{overflowX: 'auto'}}><table {...props} /></div>
          ),
        }}
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
            components={{
              table: ({node, ...props}) => (
                <div style={{overflowX: 'auto'}}><table {...props} /></div>
              ),
            }}
          >
            {part.content as string}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
