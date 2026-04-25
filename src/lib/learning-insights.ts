import { prisma } from "@/lib/prisma/client";

const prismaAny = prisma as any;

export interface WeaknessInsight {
  id: string;
  weaknessDbId?: string | null;
  topic: string;
  confidence: "high" | "medium" | "low";
  severity: "high" | "medium" | "low";
  reason: string;
  evidenceCount: number;
  recommendedAction: string;
  score: number;
  status?: "ACTIVE" | "REMEDIATED";
  aiFeedback?: string | null;
  reviewExercises?: unknown;
  lessonId?: string | null;
  lessonTitle?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  initialScore?: number | null;
  bestScore?: number | null;
  remediationCount?: number;
  signalBreakdown?: Array<{
    source: "QUIZ" | "EXERCISE" | "PROFILE" | "PROGRESS";
    weight: number;
    reason: string;
  }>;
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
    lessonId?: string | null;
    lessonTitle?: string | null;
    status?: string | null;
    aiFeedback?: string | null;
    reviewExercises?: unknown;
    weaknessDbId?: string | null;
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

type SignalSource = "QUIZ" | "EXERCISE" | "PROFILE" | "PROGRESS";

type TopicSignal = {
  source: SignalSource;
  weight: number;
  reason: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
};

type TopicAggregate = {
  score: number;
  evidenceCount: number;
  signals: TopicSignal[];
  lessonId: string | null;
  lessonTitle: string | null;
  subjectId: string | null;
  subjectName: string | null;
  status?: "ACTIVE" | "REMEDIATED";
  aiFeedback?: string | null;
  reviewExercises?: unknown;
  weaknessDbId?: string | null;
  initialScore?: number | null;
  bestScore?: number | null;
  remediationCount?: number;
};

function clampScore(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSeverity(score: number): WeaknessInsight["severity"] {
  if (score >= 80) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function getConfidence(evidenceCount: number, signalSources: Set<SignalSource>): WeaknessInsight["confidence"] {
  if (evidenceCount >= 4 || signalSources.size >= 3) return "high";
  if (evidenceCount >= 2 || signalSources.size >= 2) return "medium";
  return "low";
}

function buildRecommendedAction(topic: string, strongestSignal?: TopicSignal) {
  switch (strongestSignal?.source) {
    case "QUIZ":
      return `Ôn lại lý thuyết trọng tâm của ${topic.toLowerCase()}, sau đó làm quiz ngắn để kiểm tra lại độ chính xác.`;
    case "EXERCISE":
      return `Luyện thêm bài tập theo từng bước cho ${topic.toLowerCase()}, ưu tiên các dạng đã bị mất điểm gần đây.`;
    case "PROGRESS":
      return `Chia nhỏ phần ${topic.toLowerCase()} thành các phiên học 15-20 phút và hoàn tất bài đang học dở trước khi mở nội dung mới.`;
    case "PROFILE":
      return `Xếp ${topic.toLowerCase()} vào nhóm ôn tập cố định trong tuần và theo dõi lại sau mỗi lần luyện tập.`;
    default:
      return `Ưu tiên ôn tập và luyện thêm câu hỏi theo chủ đề ${topic.toLowerCase()}.`;
  }
}

function buildPrimaryReason(signals: TopicSignal[]) {
  const sortedSignals = [...signals].sort((a, b) => b.weight - a.weight);
  const strongest = sortedSignals[0];
  if (!strongest) return "Cần ôn tập thêm";

  const uniqueSources = new Set(sortedSignals.map((signal) => signal.source));
  if (uniqueSources.size >= 3) {
    return `${strongest.reason}. Tín hiệu này còn được củng cố bởi nhiều nguồn học tập khác.`;
  }

  if (sortedSignals.length >= 2) {
    return `${strongest.reason}. Ngoài ra còn có thêm ${sortedSignals.length - 1} tín hiệu liên quan cùng chủ đề.`;
  }

  return strongest.reason;
}

function buildWeaknessInsights(topicScores: Map<string, TopicAggregate>): WeaknessInsight[] {
  return Array.from(topicScores.entries())
    .map(([topic, item]): WeaknessInsight & { totalScore: number } => {
      const sortedSignals = [...item.signals].sort((a, b) => b.weight - a.weight);
      const signalSources = new Set(sortedSignals.map((signal) => signal.source));
      const normalizedScore = clampScore(Math.round(item.score * 16), 10, 100);
      const strongestSignal = sortedSignals[0];

      return {
        id: `weakness-${topic.toLowerCase().replace(/\s+/g, "-")}`,
        weaknessDbId: item.weaknessDbId ?? null,
        topic,
        confidence: getConfidence(item.evidenceCount, signalSources),
        severity: getSeverity(normalizedScore),
        reason: buildPrimaryReason(sortedSignals),
        evidenceCount: item.evidenceCount,
        recommendedAction: buildRecommendedAction(topic, strongestSignal),
        score: normalizedScore,
        status: item.status,
        aiFeedback: item.aiFeedback,
        reviewExercises: item.reviewExercises,
        lessonId: item.lessonId,
        lessonTitle: item.lessonTitle,
        subjectId: item.subjectId,
        subjectName: item.subjectName || topic,
        initialScore: item.initialScore ?? null,
        bestScore: item.bestScore ?? null,
        remediationCount: item.remediationCount ?? 0,
        signalBreakdown: sortedSignals.slice(0, 3).map((signal) => ({
          source: signal.source,
          weight: signal.weight,
          reason: signal.reason,
        })),
        totalScore: item.score,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.evidenceCount - a.evidenceCount)
    .slice(0, 5)
    .map(({ totalScore: _totalScore, ...item }): WeaknessInsight => item);
}

function createRoadmapSteps(weaknesses: WeaknessInsight[]): RoadmapStep[] {
  return weaknesses.slice(0, 3).flatMap((weakness, index) => {
    const stepBase = index * 3;

    return [
      {
        id: `${weakness.id}-review`,
        title: `Ôn lại nền tảng: ${weakness.topic}`,
        description: `Bắt đầu từ nguyên nhân chính: ${weakness.reason.toLowerCase()}`,
        focusTopic: weakness.topic,
        actionType: "review" as const,
        priority: stepBase + 1,
        estimatedMinutes: weakness.severity === "high" ? 25 : 20,
      },
      {
        id: `${weakness.id}-practice`,
        title: `Luyện tập có hướng dẫn: ${weakness.topic}`,
        description: weakness.recommendedAction,
        focusTopic: weakness.topic,
        actionType: "practice" as const,
        priority: stepBase + 2,
        estimatedMinutes: weakness.severity === "high" ? 30 : 25,
      },
      {
        id: `${weakness.id}-quiz`,
        title: `Tự kiểm tra nhanh: ${weakness.topic}`,
        description: `Làm một lượt kiểm tra ngắn để xác nhận ${weakness.topic.toLowerCase()} đã ổn định hơn sau khi ôn luyện.`,
        focusTopic: weakness.topic,
        actionType: "quiz" as const,
        priority: stepBase + 3,
        estimatedMinutes: weakness.confidence === "high" ? 20 : 15,
      },
    ];
  });
}

export function normalizeExerciseAttemptsToWeaknesses(
  exerciseAttempts: Array<{ exerciseTitle?: string | null; question?: string | null; score?: number | null; createdAt?: Date | string | null }>,
): WeaknessInsight[] {
  const topicScores = new Map<string, TopicAggregate>();

  for (const attempt of exerciseAttempts || []) {
    const topic = inferTopicFromText(attempt.exerciseTitle || attempt.question);
    const current = topicScores.get(topic) || {
      score: 0,
      evidenceCount: 0,
      signals: [],
      lessonId: null,
      lessonTitle: null,
      subjectId: null,
      subjectName: topic,
    };

    if (typeof attempt.score === "number" && attempt.score < 70) {
      current.score += 2.5;
      current.evidenceCount += 1;
      current.signals.push({
        source: "EXERCISE",
        weight: 2.5,
        reason: `Bài tập AI dưới ngưỡng mong muốn (${attempt.score}/100)`,
        lessonId: null,
        subjectId: null,
        subjectName: topic,
      });
    } else if (typeof attempt.score === "number" && attempt.score < 80) {
      current.score += 1.5;
      current.evidenceCount += 1;
      current.signals.push({
        source: "EXERCISE",
        weight: 1.5,
        reason: `Bài tập AI cần cải thiện (${attempt.score}/100)`,
        lessonId: null,
        subjectId: null,
        subjectName: topic,
      });
    } else if (attempt.score == null) {
      current.score += 0.5;
      current.evidenceCount += 1;
      current.signals.push({
        source: "EXERCISE",
        weight: 0.5,
        reason: "Có bài tập đang làm dở hoặc chưa được chấm",
        lessonId: null,
        subjectId: null,
        subjectName: topic,
      });
    }

    topicScores.set(topic, current);
  }

  return buildWeaknessInsights(topicScores);
}

async function getLessonWeaknesses(userId: string) {
  if (!prismaAny.lessonWeakness?.findMany) return [];

  try {
    return await prismaAny.lessonWeakness.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subjectId: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.warn("LessonWeakness table is not available yet. Run Prisma migration/db push to enable lesson-level weaknesses.");
      return [];
    }

    throw error;
  }
}

export async function getLearningInsights(userId: string): Promise<LearningInsightsResult> {
  const [user, studySessions, quizAttempts, exerciseAttempts, progress, lessonWeaknesses] = await Promise.all([
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
                id: true,
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
                id: true,
                title: true,
                subject: {
                  select: {
                    id: true,
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
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastStudiedAt: "desc" },
        { startedAt: "desc" },
      ],
      take: 40,
    }),
    getLessonWeaknesses(userId),
  ]);

  const strengths = Array.isArray(user?.profile?.strengths) ? user.profile.strengths : [];
  const profileWeaknesses = Array.isArray(user?.profile?.weaknesses) ? user.profile.weaknesses : [];

  const topicScores = new Map<string, TopicAggregate>();

  const pushWeaknessSignal = (
    topic: string,
    signal: TopicSignal,
  ) => {
    const normalizedTopic = normalizeTopic(topic);
    const current = topicScores.get(normalizedTopic) || {
      score: 0,
      evidenceCount: 0,
      signals: [],
      lessonId: signal.lessonId ?? null,
      lessonTitle: signal.lessonTitle ?? null,
      subjectId: signal.subjectId ?? null,
      subjectName: signal.subjectName ?? normalizedTopic,
      status: undefined,
      aiFeedback: undefined,
      reviewExercises: undefined,
    };

    current.score += signal.weight;
    current.evidenceCount += 1;
    current.signals.push(signal);
    current.lessonId = current.lessonId ?? signal.lessonId ?? null;
    current.lessonTitle = current.lessonTitle ?? signal.lessonTitle ?? null;
    current.subjectId = current.subjectId ?? signal.subjectId ?? null;
    current.subjectName = current.subjectName ?? signal.subjectName ?? normalizedTopic;
    topicScores.set(normalizedTopic, current);
  };

  for (const item of lessonWeaknesses || []) {
    const topic = normalizeTopic(item.topic);
    const isRemediated = item.status === "REMEDIATED";
    pushWeaknessSignal(topic, {
      source: item.source === "EXERCISE" ? "EXERCISE" : item.source === "PROFILE" ? "PROFILE" : "QUIZ",
      weight: isRemediated ? 0.5 : 4,
      reason: isRemediated ? `Đã ghi nhận khắc phục: ${item.reason}` : item.reason,
      lessonId: item.lessonId,
      lessonTitle: item.lesson?.title ?? null,
      subjectId: item.lesson?.subject?.id ?? item.lesson?.subjectId ?? null,
      subjectName: normalizeTopic(item.lesson?.subject?.name),
    });

    const current = topicScores.get(topic);
    if (current) {
      current.status = item.status === "REMEDIATED" ? "REMEDIATED" : "ACTIVE";
      current.aiFeedback = item.aiFeedback ?? null;
      current.reviewExercises = item.reviewExercises ?? null;
      current.weaknessDbId = item.id ?? null;
      current.initialScore = item.initialScore ?? null;
      current.bestScore = item.bestScore ?? null;
      current.remediationCount = item.remediationCount ?? 0;
      topicScores.set(topic, current);
    }
  }

  for (const weakness of profileWeaknesses) {
    pushWeaknessSignal(weakness, {
      source: "PROFILE",
      weight: 3,
      reason: "Được giáo viên hoặc hồ sơ học sinh đánh dấu là điểm yếu",
      lessonId: null,
      lessonTitle: null,
      subjectId: null,
      subjectName: normalizeTopic(weakness),
    });
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
      pushWeaknessSignal(topic, {
        source: "QUIZ",
        weight: 3,
        reason: `Điểm quiz thấp (${Math.round(percentage)}%)`,
        lessonId: attempt.quiz?.lesson?.id ?? null,
        lessonTitle: attempt.quiz?.lesson?.title ?? null,
        subjectId: attempt.quiz?.lesson?.subject?.id ?? null,
        subjectName: normalizeTopic(attempt.quiz?.lesson?.subject?.name),
      });
    } else if (percentage < 75) {
      pushWeaknessSignal(topic, {
        source: "QUIZ",
        weight: 1.5,
        reason: `Điểm quiz cần cải thiện (${Math.round(percentage)}%)`,
        lessonId: attempt.quiz?.lesson?.id ?? null,
        lessonTitle: attempt.quiz?.lesson?.title ?? null,
        subjectId: attempt.quiz?.lesson?.subject?.id ?? null,
        subjectName: normalizeTopic(attempt.quiz?.lesson?.subject?.name),
      });
    }
  }

  for (const attempt of exerciseAttempts || []) {
    const topic = inferTopicFromText(attempt.exerciseTitle || attempt.question);
    const score = typeof attempt.score === "number" ? attempt.score : null;

    if (score !== null && score < 70) {
      pushWeaknessSignal(topic, {
        source: "EXERCISE",
        weight: 2.5,
        reason: `Bài tập AI dưới ngưỡng mong muốn (${score}/100)`,
        lessonId: attempt.lessonId ?? null,
        lessonTitle: null,
        subjectId: null,
        subjectName: null,
      });
    } else if (score !== null && score < 80) {
      pushWeaknessSignal(topic, {
        source: "EXERCISE",
        weight: 1.5,
        reason: `Bài tập AI cần cải thiện (${score}/100)`,
        lessonId: attempt.lessonId ?? null,
        lessonTitle: null,
        subjectId: null,
        subjectName: null,
      });
    } else if (score === null) {
      pushWeaknessSignal(topic, {
        source: "EXERCISE",
        weight: 0.5,
        reason: "Có bài tập đang làm dở hoặc chưa được chấm",
        lessonId: attempt.lessonId ?? null,
        lessonTitle: null,
        subjectId: null,
        subjectName: null,
      });
    }
  }

  for (const item of progress || []) {
    const topic = normalizeTopic(item.lesson?.subject?.name) || inferTopicFromText(item.lesson?.title);

    if (item.status === "IN_PROGRESS" && Number(item.totalStudySec || 0) > 1800 && !item.completed) {
      pushWeaknessSignal(topic, {
        source: "PROGRESS",
        weight: 1,
        reason: "Đã học khá lâu nhưng bài vẫn chưa hoàn tất",
        lessonId: item.lessonId ?? null,
        lessonTitle: item.lesson?.title ?? null,
        subjectId: item.lesson?.subject?.id ?? null,
        subjectName: normalizeTopic(item.lesson?.subject?.name),
      });
    }
  }

  const weaknesses = buildWeaknessInsights(topicScores);

  const mistakes = [
    ...(lessonWeaknesses || []).slice(0, 8).map((item: any) => ({
      source: item.source === "EXERCISE" ? "EXERCISE" as const : "QUIZ" as const,
      topic: normalizeTopic(item.topic),
      note: item.reason,
      score: item.score ?? null,
      createdAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
      lessonId: item.lessonId,
      lessonTitle: item.lesson?.title ?? null,
      status: item.status,
      aiFeedback: item.aiFeedback ?? null,
      reviewExercises: item.reviewExercises ?? null,
      weaknessDbId: item.id ?? null,
    })),
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
