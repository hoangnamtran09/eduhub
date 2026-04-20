
import { getModel } from "@/lib/ai/models";
import { chatWithGemini } from "@/lib/googleai/client";
import OpenAI from "openai";

const beeknoeeClient = new OpenAI({
  apiKey: process.env.BEEKNOEE_API_KEY!,
  baseURL: "https://platform.beeknoee.com/api/v1",
});


export async function chatWithAI(messages: { role: string; content: string }[]) {
  try {
    // Hàm gọi AI, retry 1 lần nếu không có output
    let response = await beeknoeeClient.chat.completions.create({
      model: getModel("chat"),
      messages: messages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    let output = response.choices?.[0]?.message?.content?.trim();
    if (!output) {
      // Retry 1 lần nếu lần đầu không có output
      response = await beeknoeeClient.chat.completions.create({
        model: getModel("chat"),
        messages: messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      });
      output = response.choices?.[0]?.message?.content?.trim();
    }
    
    if (output) return output;

    // Nếu vẫn không có output, fallback sang Gemini
    console.log("Beeknoee empty response, falling back to Gemini...");
    return await chatWithGemini(messages);

  } catch (error) {
    console.error("Beeknoee API Error, falling back to Gemini:", error);
    try {
      return await chatWithGemini(messages);
    } catch (geminiError) {
      console.error("Gemini Fallback Error:", geminiError);
      return "Xin lỗi, hiện tại tất cả các hệ thống AI đều đang bận. Bạn vui lòng thử lại sau vài phút nhé!";
    }
  }
}

export { beeknoeeClient };