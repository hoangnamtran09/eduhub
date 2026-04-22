import { getModel } from "@/lib/ai/models";
import OpenAI from "openai";

const aiBaseURL = process.env.BEEKNOEE_BASE_URL || "https://api.krouter.net/v1";

const beeknoeeClient = new OpenAI({
  apiKey: process.env.BEEKNOEE_API_KEY!,
  baseURL: aiBaseURL,
});


export async function chatWithAI(messages: { role: string; content: string }[]) {
  try {
    // Retry one time if the upstream model returns an empty payload.
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

    console.warn("Beeknoee returned an empty response after retry.");
    return "Xin lỗi, hiện tại hệ thống AI chưa trả về kết quả. Bạn vui lòng thử lại sau vài phút nhé!";

  } catch (error) {
    console.error("Beeknoee API Error:", error);
    return "Xin lỗi, hiện tại hệ thống AI đang bận. Bạn vui lòng thử lại sau vài phút nhé!";
  }
}

export { beeknoeeClient };
