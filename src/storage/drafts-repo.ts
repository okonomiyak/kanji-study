import type { QuizState } from "../domain/quiz-session";
import { sanitizeOps, type Op } from "../handwriting/strokes";
import { getDB } from "./db";

export const DRAFT_KEY = "current";

/** 未完了の回（仕様書 4.3、4.4）。同時に1つまで */
export interface Draft {
  quiz: QuizState;
  /** 各問題の手書き操作の列 */
  inks: Op[][];
  savedAt: string;
}

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDB();
  await db.put("draft", draft, DRAFT_KEY);
}

export async function loadDraft(): Promise<Draft | null> {
  const db = await getDB();
  return sanitizeDraft(await db.get("draft", DRAFT_KEY));
}

/** 保存された下書きを検査する。壊れていれば null（再開を聞かずに捨てる） */
export function sanitizeDraft(value: unknown): Draft | null {
  if (typeof value !== "object" || value === null) return null;
  const d = value as Partial<Draft>;
  const q = d.quiz;
  if (!q || !Array.isArray(q.questionIds) || q.questionIds.length === 0)
    return null;
  if (!q.questionIds.every((id) => typeof id === "string")) return null;
  if (q.phase !== "answering" && q.phase !== "grading") return null;
  if (q.mode !== "normal" && q.mode !== "review") return null;
  if (typeof q.sessionId !== "string" || typeof q.startedAt !== "string")
    return null;
  const n = q.questionIds.length;
  const grades = Array.from({ length: n }, (_, i) => {
    const g = Array.isArray(q.grades) ? q.grades[i] : null;
    return typeof g === "boolean" ? g : null;
  });
  const index = Number.isInteger(q.index)
    ? Math.min(Math.max(q.index, 0), n - 1)
    : 0;
  return {
    quiz: { ...q, grades, index },
    inks: q.questionIds.map((_, i) =>
      sanitizeOps(Array.isArray(d.inks) ? d.inks[i] : undefined),
    ),
    savedAt: typeof d.savedAt === "string" ? d.savedAt : "",
  };
}

export async function deleteDraft(): Promise<void> {
  const db = await getDB();
  await db.delete("draft", DRAFT_KEY);
}
