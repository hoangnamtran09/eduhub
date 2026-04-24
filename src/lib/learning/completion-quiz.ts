export type CompletionQuizOption = {
  text: string;
  isCorrect: boolean;
};

export type CompletionQuizQuestion = {
  question: string;
  options: CompletionQuizOption[];
  explanation?: string;
};

export function normalizeCompletionQuizQuestions(value: unknown, limit = 3): CompletionQuizQuestion[] {
  const rawQuestions = Array.isArray((value as { questions?: unknown })?.questions)
    ? (value as { questions: unknown[] }).questions
    : [];

  return rawQuestions
    .map((item): CompletionQuizQuestion | null => {
      const question = typeof (item as { question?: unknown })?.question === "string"
        ? ((item as { question: string }).question).trim()
        : "";
      const rawOptions = (item as { options?: unknown })?.options;

      if (!question || !Array.isArray(rawOptions)) return null;

      const options = rawOptions
        .map((option): CompletionQuizOption | null => {
          const text = typeof (option as { text?: unknown })?.text === "string"
            ? ((option as { text: string }).text).trim()
            : "";
          if (!text) return null;
          return {
            text,
            isCorrect: Boolean((option as { isCorrect?: unknown }).isCorrect),
          };
        })
        .filter((option): option is CompletionQuizOption => Boolean(option))
        .slice(0, 4);

      if (options.length !== 4 || options.filter((option) => option.isCorrect).length !== 1) {
        return null;
      }

      return {
        question,
        options,
        explanation: typeof (item as { explanation?: unknown })?.explanation === "string"
          ? ((item as { explanation: string }).explanation).trim()
          : undefined,
      };
    })
    .filter((question): question is CompletionQuizQuestion => Boolean(question))
    .slice(0, limit);
}

export function toPublicCompletionQuiz(quiz: any) {
  return {
    id: quiz.id,
    title: quiz.title,
    lessonId: quiz.lessonId,
    questions: (quiz.questions || []).map((question: any) => ({
      id: question.id,
      question: question.question,
      options: Array.isArray(question.options)
        ? question.options.map((option: CompletionQuizOption, index: number) => ({
            id: String(index),
            text: option.text,
          }))
        : [],
      explanation: question.explanation || "",
      order: question.order,
    })),
  };
}
