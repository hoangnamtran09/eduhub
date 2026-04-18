import { NextRequest, NextResponse } from "next/server";
import { beeknoeeClient } from "@/lib/beeknoee/client";
import { getModel } from "@/lib/ai/models";

interface ChatRequest {
  messages: { role: string; content: string }[];
  lessonTitle?: string;
  lessonContent?: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, lessonTitle, lessonContent, model } = body;

    const systemPrompt = lessonContent
      ? `Bạn là một AI gia sư thông minh, giúp học sinh hiểu bài học. 
Hãy trả lời dựa trên nội dung bài học sau:
---
${lessonContent}
---
Chỉ trả lời bằng tiếng Việt.`
      : "Bạn là một AI gia sư thông minh. Chỉ trả lời bằng tiếng Việt.";

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const selectedModel = model || getModel("chat");

    const response = await beeknoeeClient.chat.completions.create({
      model: selectedModel,
      messages: allMessages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    const assistantMessage = response.choices[0].message.content || "Xin lỗi, mình chưa trả lời được.";

    return NextResponse.json({ message: assistantMessage, model: selectedModel });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}