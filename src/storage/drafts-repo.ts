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
  const d = await db.get("draft", DRAFT_KEY);
  if (
    !d ||
    typeof d !== "object" ||
    !d.quiz ||
    !Array.isArray(d.quiz.questionIds)
  )
    return null;
  if (d.quiz.phase === "confirmed") return null;
  return {
    ...d,
    inks: d.quiz.questionIds.map((_, i) => sanitizeOps(d.inks?.[i])),
  };
}

export async function deleteDraft(): Promise<void> {
  const db = await getDB();
  await db.delete("draft", DRAFT_KEY);
}
