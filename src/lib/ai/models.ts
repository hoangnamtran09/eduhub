/**
 * AI Model Configuration
 * 
 * Configure different AI models for different features.
 * Edit the model names below to change which model each feature uses.
 * 
 * Available models on Beeknoee:
 * - Claude-chat (Claude 3.5, balanced)
 * - Claude-chat-20250307 (Claude latest)
 * - GLM-4-Flash (fast, cheap)
 * - GLM-4.7-Flash (larger context)
 * - claude-sonnet-4-6 (Claude, good for reasoning)
 * - Qwen-Turbo (Alibaba, fast)
 */

export const AI_MODELS = {
  // Chat/AI Tutor - for student Q&A and tutoring
  chat: "GLM-4-Flash",           // Use GLM for fast responses in chat
  
  // PDF Processing - extract content and structure from PDFs
  pdfExtract: "GLM-4-Flash",      // Use GLM for PDF parsing
  
  // Quiz Generation - create questions from lesson content
  quizGenerate: "GLM-4-Flash",    // Use GLM for quiz generation
  
  // OCR - extract text from images (use faster model)
  ocr: "GLM-4-Flash",             // Use GLM for text extraction
  
  // Translation - translate content between languages
  translate: "GLM-4-Flash",       // Use GLM for translation
  
  // Code Generation - generate code snippets
  codeGenerate: "claude-sonnet-4-6",  // Use Claude for code (better at reasoning)
  
  // Math Solving - solve math problems (use model with math capability)
  math: "GLM-4-Flash",            // Use GLM for math
} as const;

export type AIFeature = keyof typeof AI_MODELS;
export const getModel = (feature: AIFeature): string => AI_MODELS[feature];