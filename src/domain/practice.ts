import type { ReviewEntry } from "./review";
import type { QuestionStats } from "./stats";
import type { Question, QuestionId } from "./types";

/**
 * 間違えた問題の練習（なぞり書き・書き写し）。採点も記録もしない。
 * review: いま復習リストにある問題、missed: これまでに1回でも間違えた問題。
 */
export type PracticeSource = "review" | "missed";

/** 練習する問題を、問題の並び順で返す（問題データに無いものは除く） */
export function practiceQuestions(
  questions: readonly Question[],
  review: ReadonlyMap<QuestionId, ReviewEntry>,
  stats: readonly QuestionStats[],
  source: PracticeSource,
): Question[] {
  const ids =
    source === "review"
      ? new Set(review.keys())
      : new Set(stats.filter((s) => s.wrong > 0).map((s) => s.questionId));
  return questions.filter((q) => ids.has(q.id));
}
