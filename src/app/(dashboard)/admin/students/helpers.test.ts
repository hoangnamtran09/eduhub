import { describe, expect, it } from "vitest";
import {
  createForm,
  formatStudyTime,
  toLineValue,
  toListValue,
  type StudentRecord,
} from "@/app/(dashboard)/admin/students/helpers";

const sampleStudent: StudentRecord = {
  id: "student-1",
  email: "student@example.com",
  fullName: "Nguyen Van A",
  gradeLevel: 8,
  diamonds: 15,
  parentId: null,
  parent: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  profile: {
    goals: ["Làm tốt đại số", "Tăng tốc độ giải bài"],
    strengths: ["Hình học"],
    weaknesses: ["Phân tích đề"],
    streakDays: 3,
    lastActive: null,
  },
  studySessions: [{ durationSec: 1800 }],
  enrollments: [],
};

describe("student admin helpers", () => {
  it("joins list items into multiline strings", () => {
    expect(toLineValue(["a", "b", "c"])) .toBe("a\nb\nc");
    expect(toLineValue()).toBe("");
  });

  it("normalizes multiline text back into trimmed list items", () => {
    expect(toListValue("  mục 1\n\n mục 2 \n   ")).toEqual(["mục 1", "mục 2"]);
  });

  it("creates an editable form payload from a student record", () => {
    expect(createForm(sampleStudent)).toEqual({
      id: "student-1",
      email: "student@example.com",
      fullName: "Nguyen Van A",
      gradeLevel: "8",
      diamonds: "15",
      parentId: "",
      goals: "Làm tốt đại số\nTăng tốc độ giải bài",
      strengths: "Hình học",
      weaknesses: "Phân tích đề",
    });
  });

  it("formats study time as hours for long sessions", () => {
    expect(formatStudyTime(5400)).toBe("1.5 giờ");
  });

  it("formats short sessions as at least one minute", () => {
    expect(formatStudyTime(5)).toBe("1 phút");
    expect(formatStudyTime(1800)).toBe("30 phút");
  });
});
