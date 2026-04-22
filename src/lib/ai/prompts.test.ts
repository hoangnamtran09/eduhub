import { describe, expect, it } from "vitest";
import {
  formatConversationHistory,
  getExercisePrompt,
  getGraderPrompt,
  getTutorPrompt,
} from "@/lib/ai/prompts";

describe("AI prompt helpers", () => {
  it("injects lesson context into the tutor prompt", () => {
    const prompt = getTutorPrompt("Hàm bậc nhất", "Toán", 9, "Nội dung bài học mẫu");

    expect(prompt).toContain("Bài học: Hàm bậc nhất");
    expect(prompt).toContain("Môn: Toán");
    expect(prompt).toContain("Khối lớp: 9");
    expect(prompt).toContain("Nội dung bài học mẫu");
  });

  it("uses fallback lesson content when no content is available", () => {
    const prompt = getTutorPrompt("Ôn tập", "Vật lý", 7, "");

    expect(prompt).toContain("Chưa có nội dung bài học");
  });

  it("formats conversation history with localized speaker labels", () => {
    const output = formatConversationHistory([
      { role: "user", content: "Em chưa hiểu phần này" },
      { role: "assistant", content: "Mình cùng làm từng bước nhé" },
    ]);

    expect(output).toBe(
      "Học sinh: Em chưa hiểu phần này\nGia Sư AI: Mình cùng làm từng bước nhé"
    );
  });

  it("renders the exercise prompt with the selected grade level", () => {
    expect(getExercisePrompt(6)).toContain("khối lớp 6");
  });

  it("renders the grader prompt with question and answer context", () => {
    const prompt = getGraderPrompt("2 + 2 bằng bao nhiêu?", "Bằng 4");

    expect(prompt).toContain("**Câu hỏi:** 2 + 2 bằng bao nhiêu?");
    expect(prompt).toContain("**Câu trả lời của học sinh:** Bằng 4");
  });
});
