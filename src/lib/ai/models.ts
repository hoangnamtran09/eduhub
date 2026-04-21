

export const AI_MODELS = {
  // Chat/AI Tutor - for student Q&A and tutoring
  chat: "gpt-5.4",

  // PDF Processing - extract content and structure from PDFs
  pdfExtract: "glm-4-flash",

  // Quiz Generation - create questions from lesson content
  quizGenerate: "glm-4-flash",

  // Translation - translate content between languages
  translate: "glm-4-flash",

  // Code Generation - generate code snippets
  codeGenerate: "claude-3-5-sonnet",

  // Math Solving - solve math problems (use model with math capability)
  math: "glm-4-flash",
} as const;

export type AIFeature = keyof typeof AI_MODELS;
export const getModel = (feature: AIFeature): string => AI_MODELS[feature];
