import { describe, expect, it, vi, afterEach } from "vitest";
import { getLearningInsights, normalizeExerciseAttemptsToWeaknesses } from "@/lib/learning-insights";
import { prisma } from "@/lib/prisma/client";

const prismaMock = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  studySession: { findMany: ReturnType<typeof vi.fn> };
  quizAttempt: { findMany: ReturnType<typeof vi.fn> };
  exerciseAttempt: { findMany: ReturnType<typeof vi.fn> };
  lessonProgress: { findMany: ReturnType<typeof vi.fn> };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("learning insights helpers", () => {
  it("prioritizes repeated weak exercise signals and builds actionable explanations", () => {
    const weaknesses = normalizeExerciseAttemptsToWeaknesses([
      {
        exerciseTitle: "Phuong trinh bac nhat",
        question: "Giai phuong trinh 2x + 3 = 7",
        score: 45,
      },
      {
        exerciseTitle: "Phuong trinh bac nhat",
        question: "Giai phuong trinh 5x - 10 = 0",
        score: 62,
      },
      {
        exerciseTitle: "Phuong trinh bac nhat",
        question: "Giai phuong trinh x + 8 = 15",
        score: 78,
      },
      {
        exerciseTitle: "Hinh hoc tam giac",
        question: "Tinh tong 3 goc trong tam giac",
        score: 72,
      },
    ]);

    expect(weaknesses).toHaveLength(2);
    expect(weaknesses[0]?.topic).toBe("Phuong trinh bac nhat");
    expect(weaknesses[0]?.confidence).toBe("medium");
    expect(weaknesses[0]?.severity).toBe("high");
    expect(weaknesses[0]?.reason).toContain("Bài tập AI dưới ngưỡng mong muốn");
    expect(weaknesses[0]?.reason).toContain("2 tín hiệu liên quan");
    expect(weaknesses[0]?.recommendedAction).toContain("Luyện thêm bài tập theo từng bước");
    expect(weaknesses[0]?.signalBreakdown).toHaveLength(3);
    expect(weaknesses[0]?.score).toBeGreaterThan(weaknesses[1]?.score ?? 0);
  });

  it("keeps low-confidence unfinished work visible with softer severity", () => {
    const weaknesses = normalizeExerciseAttemptsToWeaknesses([
      {
        exerciseTitle: "Ti le thuc",
        question: "Dien vao cho trong",
        score: null,
      },
    ]);

    expect(weaknesses).toHaveLength(1);
    expect(weaknesses[0]?.topic).toBe("Ti le thuc");
    expect(weaknesses[0]?.confidence).toBe("low");
    expect(weaknesses[0]?.severity).toBe("low");
    expect(weaknesses[0]?.reason).toBe("Có bài tập đang làm dở hoặc chưa được chấm");
    expect(weaknesses[0]?.recommendedAction).toContain("Luyện thêm bài tập theo từng bước");
    expect(weaknesses[0]?.score).toBeGreaterThanOrEqual(10);
  });
  it("combines profile, quiz, exercise and progress signals into a ranked roadmap", async () => {
    prismaMock.user.findUnique = vi.fn().mockResolvedValue({
      profile: {
        strengths: ["Hình học"],
        weaknesses: ["Đại số"],
        streakDays: 6,
      },
    });
    prismaMock.studySession.findMany = vi.fn().mockResolvedValue([
      { durationSec: 1200 },
      { durationSec: 1800 },
    ]);
    prismaMock.quizAttempt.findMany = vi.fn().mockResolvedValue([
      {
        score: 4,
        totalQuestions: 10,
        startedAt: new Date("2026-04-20T08:00:00.000Z"),
        quiz: {
          lesson: {
            id: "lesson-dai-so",
            title: "Phuong trinh va he phuong trinh",
            subject: { name: "Đại số" },
          },
        },
      },
    ]);
    prismaMock.exerciseAttempt.findMany = vi.fn().mockResolvedValue([
      {
        lessonId: "lesson-dai-so",
        exerciseTitle: "Phuong trinh bac nhat",
        question: "Giai phuong trinh",
        score: 55,
        createdAt: new Date("2026-04-21T08:00:00.000Z"),
      },
    ]);
    prismaMock.lessonProgress.findMany = vi.fn().mockResolvedValue([
      {
        lessonId: "lesson-dai-so",
        status: "IN_PROGRESS",
        totalStudySec: 2400,
        completed: false,
        lesson: {
          title: "Phuong trinh va he phuong trinh",
          subject: { name: "Đại số" },
        },
      },
    ]);

    const result = await getLearningInsights("student-1");

    expect(result.summary.totalStudySeconds).toBe(3000);
    expect(result.summary.averageQuizScore).toBe(40);
    expect(result.summary.streakDays).toBe(6);
    expect(result.weaknesses[0]?.topic).toBe("Đại số");
    expect(result.weaknesses[0]?.confidence).toBe("high");
    expect(result.weaknesses[0]?.severity).toBe("high");
    expect(result.weaknesses[0]?.lessonId).toBe("lesson-dai-so");
    expect(result.weaknesses[0]?.signalBreakdown?.map((item) => item.source)).toContain("QUIZ");
    expect(result.weaknesses[0]?.signalBreakdown?.map((item) => item.source)).toContain("PROFILE");
    expect(result.roadmap).toHaveLength(6);
    expect(result.roadmap[0]?.focusTopic).toBe("Đại số");
    expect(result.roadmap[0]?.priority).toBe(1);
    expect(result.roadmap[3]?.priority).toBe(4);
    expect(result.mistakes[0]?.topic).toBe("Phuong trinh bac nhat");
  });
});
