import type { Prisma } from "@prisma/client";

export interface AssignmentRubricCriterionJson {
  id: string;
  title: string;
  maxScore: number;
  description?: string;
}

export interface AssignmentRubricScoreJson {
  criterionId: string;
  title: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface AssignmentSubmissionFileJson {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export function parseAssignmentRubric(value: Prisma.JsonValue | null | undefined): AssignmentRubricCriterionJson[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.title !== "string") return [];

    const maxScore = Number(candidate.maxScore);
    if (!Number.isFinite(maxScore)) return [];

    return [{
      id: candidate.id,
      title: candidate.title,
      maxScore,
      description: typeof candidate.description === "string" ? candidate.description : undefined,
    }];
  });
}

export function parseSubmissionFiles(value: Prisma.JsonValue | null | undefined): AssignmentSubmissionFileJson[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Record<string, unknown>;
    if (typeof candidate.name !== "string" || typeof candidate.url !== "string") return [];

    return [{
      name: candidate.name,
      url: candidate.url,
      type: typeof candidate.type === "string" ? candidate.type : undefined,
      size: typeof candidate.size === "number" ? candidate.size : undefined,
    }];
  });
}
