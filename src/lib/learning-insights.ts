import { prisma } from "@/lib/prisma/client";

const prismaAny = prisma as any;

export interface WeaknessInsight {
  id: string;
  topic: string;
  confidence: "high" | "medium" | "low";
  severity: "high" | "medium" | "low";
  reason: string;
  evidenceCount: number;
  recommendedAction: string;
  score: number;
  lessonId?: string | null;
  subjectName?: string | null;
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  focusTopic: string;
  actionType: "review" | "practice" | "quiz" | "study";
  priority: number;
  estimatedMinutes: number;
}

export interface LearningInsightsResult {
  generatedAt: string;
  strengths: string[];
  weaknesses: WeaknessInsight[];
  mistakes: Array<{
    source: "QUIZ" | "EXERCISE" | "PROFILE";
    topic: string;
    note: string;
    score?: number | null;
    createdAt?: string | null;
  }>;
  roadmap: RoadmapStep[];
  summary: {
    totalStudySeconds: number;
    averageQuizScore: number;
    lowScoreCount: number;
    practiceCount: number;
    streakDays: number;
  };
}

function toTitleCase(value: string) {
  if (!value) return "Tổng quan";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeTopic(value: string | null | undefined) {
  if (!value) return "Tổng quan";

  return value
    .replace(/\s+/g, " ")
    .replace(/[\-_]+/g, " ")
    .trim();
}

export function inferTopicFromText(value: string | null | undefined) {
  const normalized = normalizeTopic(value);
  if (!normalized || normalized === "Tổng quan") return normalized;

  const segments = normalized
    .split(/[\n,.!?:;-]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const preferred = segments.find((item) => item.length >= 4 && item.length <= 60);
  return toTitleCase(preferred || normalized.slice(0, 60));
}

function createRoadmapSteps(weaknesses: WeaknessInsight[]): RoadmapStep[] {
  return weaknesses.slice(0, 3).flatMap((weakness, index) => {
    const basePriority = index + 1;

    return [
      {
        id: `${basePriority}-review`,
        title: `Ôn lại nền tảng: ${weakness.topic}`,
        description: `Đọc lại lý thuyết và ví dụ mẫu để xử lý vấn đề: ${weakness.reason.toLowerCase()}.`,
        focusTopic: weakness.topic,
        actionType: "review" as const,
        priority: basePriority,
        estimatedMinutes: 20,
      },
      {
        id: `${basePriority}-practice`,
        title: `Luyện tập có hướng dẫn: ${weakness.topic}`,
        description: `Làm 3-5 bài tập ngắn, ưu tiên các câu từng làm sai hoặc còn lúng túng.`,
        focusTopic: weakness.topic,
        actionType: "practice" as const,
        priority: basePriority + 1,
        estimatedMinutes: 25,
      },
      {
        id: `${basePriority}-quiz`,
        title: `Tự kiểm tra nhanh: ${weakness.topic}`,
        description: `Tự làm một lượt quiz ngắn để xác nhận bạn đã cải thiện sau khi ôn tập.`,
        focusTopic: weakness.topic,
        actionType: "quiz" as const,
        priority: basePriority + 2,
        estimatedMinutes: 15,
      },
    ];
  });
}

export function normalizeExerciseAttemptsToWeaknesses(
  exerciseAttempts: Array<{ exerciseTitle?: string | null; question?: string | null; score?: number | null; createdAt?: Date | string | null }>,
): WeaknessInsight[] {
  const topicScores = new Map<string, { score: number; evidenceCount: number; reasons: string[] }>();

  for (const attempt of exerciseAttempts || []) {
    const topic = inferTopicFromText(attempt.exerciseTitle || attempt.question);
    const score = typeof attempt.score === "number" ? attempt.score : null;
    const current = topicScores.get(topic) || { score: 0, evidenceCount: 0, reasons: [] };

    if (score !== null && score < 70) {
      current.score += 2.5;
      current.evidenceCount += 1;
      current.reasons.push(`Bài tập AI dưới ngưỡng mong muốn (${score}/100)`);
    } else if (score !== null && score < 80) {
      current.score += 1.5;
      current.evidenceCount += 1;
      current.reasons.push(`Bài tập AI cần cải thiện (${score}/100)`);
    } else if (score === null) {
      current.score += 0.5;
      current.evidenceCount += 1;
      current.reasons.push("Có bài tập đang làm dở hoặc chưa được chấm");
    }

    topicScores.set(topic, current);
  }

  return Array.from(topicScores.entries())
    .map(([topic, item]): WeaknessInsight & { totalScore: number } => ({
      id: `exercise-${topic.toLowerCase().replace(/\s+/g, "-")}`,
      topic,
      confidence: item.score >= 5 ? "high" : item.score >= 2.5 ? "medium" : "low",
      severity: item.score >= 5 ? "high" : item.score >= 2.5 ? "medium" : "low",
      reason: item.reasons[0] || "Cần ôn tập thêm",
      evidenceCount: item.evidenceCount,
      recommendedAction: `Ưu tiên ôn tập và luyện thêm câu hỏi theo chủ đề ${topic.toLowerCase()}.`,
      score: Math.round(item.score * 10),
      lessonId: null,
      subjectName: topic,
      totalScore: item.score,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map(({ totalScore: _totalScore, ...item }): WeaknessInsight => item);
}

export async function getLearningInsights(userId: string): Promise<LearningInsightsResult> {
  const [user, studySessions, quizAttempts, exerciseAttempts, progress] = await Promise.all([
    prismaAny.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prismaAny.studySession.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    prismaAny.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            lesson: {
              select: {
                title: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    prismaAny.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prismaAny.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            title: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
  ]);

  const strengths = Array.isArray(user?.profile?.strengths) ? user.profile.strengths : [];
  const profileWeaknesses = Array.isArray(user?.profile?.weaknesses) ? user.profile.weaknesses : [];

  const topicScores = new Map<string, { score: number; evidenceCount: number; reasons: string[] }>();

  const pushWeaknessSignal = (topic: string, score: number, reason: string) => {
    const normalizedTopic = normalizeTopic(topic);
    const current = topicScores.get(normalizedTopic) || { score: 0, evidenceCount: 0, reasons: [] };
    current.score += score;
    current.evidenceCount += 1;
    current.reasons.push(reason);
    topicScores.set(normalizedTopic, current);
  };

  for (const weakness of profileWeaknesses) {
    pushWeaknessSignal(weakness, 3, "Được giáo viên hoặc hồ sơ học sinh đánh dấu là điểm yếu");
  }

  for (const attempt of quizAttempts || []) {
    const topic =
      normalizeTopic(attempt.quiz?.lesson?.subject?.name) ||
      inferTopicFromText(attempt.quiz?.lesson?.title) ||
      "Quiz";

    const totalQuestions = Number(attempt.totalQuestions || 0);
    const rawScore = Number(attempt.score || 0);
    const percentage = totalQuestions > 0 && rawScore <= totalQuestions ? (rawScore / totalQuestions) * 100 : rawScore;

    if (percentage < 60) {
      pushWeaknessSignal(topic, 3, `Điểm quiz thấp (${Math.round(percentage)}%)`);
    } else if (percentage < 75) {
      pushWeaknessSignal(topic, 1.5, `Điểm quiz cần cải thiện (${Math.round(percentage)}%)`);
    }
  }

  for (const attempt of exerciseAttempts || []) {
    const topic = inferTopicFromText(attempt.exerciseTitle || attempt.question);
    const score = typeof attempt.score === "number" ? attempt.score : null;

    if (score !== null && score < 70) {
      pushWeaknessSignal(topic, 2.5, `Bài tập AI dưới ngưỡng mong muốn (${score}/100)`);
    } else if (score === null) {
      pushWeaknessSignal(topic, 0.5, "Có bài tập đang làm dở hoặc chưa được chấm");
    }
  }

  for (const item of progress || []) {
    const topic = normalizeTopic(item.lesson?.subject?.name) || inferTopicFromText(item.lesson?.title);

    if (item.status === "IN_PROGRESS" && Number(item.totalStudySec || 0) > 1800 && !item.completed) {
      pushWeaknessSignal(topic, 1, "Đã học khá lâu nhưng bài vẫn chưa hoàn tất");
    }
  }

  const weaknesses = Array.from(topicScores.entries())
    .map(([topic, item]): WeaknessInsight & { totalScore: number } => ({
      id: `weakness-${topic.toLowerCase().replace(/\s+/g, "-")}`,
      topic,
      confidence: item.score >= 5 ? "high" : item.score >= 2.5 ? "medium" : "low",
      severity: item.score >= 5 ? "high" : item.score >= 2.5 ? "medium" : "low",
      reason: item.reasons[0] || "Cần ôn tập thêm",
      evidenceCount: item.evidenceCount,
      recommendedAction: `Ưu tiên ôn tập và luyện thêm câu hỏi theo chủ đề ${topic.toLowerCase()}.`,
      score: Math.round(item.score * 10),
      lessonId: null,
      subjectName: topic,
      totalScore: item.score,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map(({ totalScore: _totalScore, ...item }): WeaknessInsight => item);

  const mistakes = [
    ...profileWeaknesses.slice(0, 5).map((topic: string) => ({
      source: "PROFILE" as const,
      topic: normalizeTopic(topic),
      note: "Điểm yếu được ghi nhận trong hồ sơ học sinh",
      score: null,
      createdAt: null,
    })),
    ...(quizAttempts || [])
      .filter((attempt: any) => {
        const totalQuestions = Number(attempt.totalQuestions || 0);
        const rawScore = Number(attempt.score || 0);
        const percentage = totalQuestions > 0 && rawScore <= totalQuestions ? (rawScore / totalQuestions) * 100 : rawScore;
        return percentage < 75;
      })
      .slice(0, 5)
      .map((attempt: any) => {
        const totalQuestions = Number(attempt.totalQuestions || 0);
        const rawScore = Number(attempt.score || 0);
        const percentage = totalQuestions > 0 && rawScore <= totalQuestions ? Math.round((rawScore / totalQuestions) * 100) : rawScore;

        return {
          source: "QUIZ" as const,
          topic: normalizeTopic(attempt.quiz?.lesson?.subject?.name) || inferTopicFromText(attempt.quiz?.lesson?.title),
          note: `Quiz gần đây có kết quả chưa vững (${percentage}%)`,
          score: percentage,
          createdAt: attempt.startedAt ? new Date(attempt.startedAt).toISOString() : null,
        };
      }),
    ...(exerciseAttempts || [])
      .filter((attempt: any) => typeof attempt.score === "number" && attempt.score < 80)
      .slice(0, 5)
      .map((attempt: any) => ({
        source: "EXERCISE" as const,
        topic: inferTopicFromText(attempt.exerciseTitle || attempt.question),
        note: `Bài tập AI cần xem lại (${attempt.score}/100)`,
        score: Number(attempt.score),
        createdAt: attempt.createdAt ? new Date(attempt.createdAt).toISOString() : null,
      })),
  ]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  const totalStudySeconds = (studySessions || []).reduce((sum: number, session: any) => sum + Number(session.durationSec || 0), 0);
  const lowScoreCount = mistakes.filter((item) => item.source !== "PROFILE").length;
  const practiceCount = (exerciseAttempts || []).length;
  const averageQuizScore = (quizAttempts || []).length
    ? Number(
        (
          (quizAttempts || []).reduce((sum: number, attempt: any) => {
            const totalQuestions = Number(attempt.totalQuestions || 0);
            const rawScore = Number(attempt.score || 0);
            const percentage = totalQuestions > 0 && rawScore <= totalQuestions ? (rawScore / totalQuestions) * 100 : rawScore;
            return sum + percentage;
          }, 0) / quizAttempts.length
        ).toFixed(1),
      )
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    strengths,
    weaknesses,
    mistakes,
    roadmap: createRoadmapSteps(weaknesses),
    summary: {
      totalStudySeconds,
      averageQuizScore,
      lowScoreCount,
      practiceCount,
      streakDays: Number(user?.profile?.streakDays || 0),
    },
  };
}
