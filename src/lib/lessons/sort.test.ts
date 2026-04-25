import { describe, expect, it } from "vitest";
import { sortLessonsNatural } from "./sort";

describe("sortLessonsNatural", () => {
  it("sorts lesson titles with numbers from low to high", () => {
    const lessons = [
      { title: "Bài 10: Ôn tập", order: 1 },
      { title: "Bài 2: Phân số", order: 2 },
      { title: "Bài 1: Số tự nhiên", order: 3 },
    ];

    expect(sortLessonsNatural(lessons).map((lesson) => lesson.title)).toEqual([
      "Bài 1: Số tự nhiên",
      "Bài 2: Phân số",
      "Bài 10: Ôn tập",
    ]);
  });
});
