import { describe, expect, it } from "vitest";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("removes Vietnamese diacritics and punctuation", () => {
    expect(generateSlug("Bài 1: Hàm số lượng giác")).toBe("bai-1-ham-so-luong-giac");
  });

  it("normalizes whitespace and duplicate hyphens", () => {
    expect(generateSlug("  Toán   học -- nâng cao  ")).toBe("toan-hoc-nang-cao");
  });

  it("returns an empty string for empty input", () => {
    expect(generateSlug("")).toBe("");
  });
});

describe("generateUniqueSlug", () => {
  it("returns the base slug when no conflict exists", () => {
    expect(generateUniqueSlug("toan-hoc", ["vat-ly", "hoa-hoc"])).toBe("toan-hoc");
  });

  it("appends the next available numeric suffix", () => {
    expect(generateUniqueSlug("toan-hoc", ["toan-hoc", "toan-hoc-1", "toan-hoc-2"])).toBe(
      "toan-hoc-3"
    );
  });
});
