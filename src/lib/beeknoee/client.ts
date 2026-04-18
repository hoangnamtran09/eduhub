import OpenAI from "openai";

const beeknoeeClient = new OpenAI({
  apiKey: process.env.BEEKNOEE_API_KEY || "sk-bee-c462a4f8e71641499a551bc5a2214660",
  baseURL: "https://platform.beeknoee.com/api/v1",
});

export async function chatWithAI(messages: { role: string; content: string }[]) {
  const response = await beeknoeeClient.chat.completions.create({
    model: "Claude-chat",
    messages: messages.map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  });

  return response.choices[0].message.content;
}

export { beeknoeeClient };