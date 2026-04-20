import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GOOGLE_GEMINI_API_KEY is not set in environment variables");
}

export const geminiClient = new GoogleGenerativeAI(geminiApiKey);

export async function chatWithGemini(messages: { role: string; content: string }[]) {
  // Tách system prompt nếu có
  const systemMessage = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  // Chuyển đổi messages sang format Gemini
  const history = chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = geminiClient.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: systemMessage?.content,
  });

  const result = await model.generateContent({ contents: history });
  const response = result.response;
  return response.text();
}
