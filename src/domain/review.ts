import type { Attempt, QuestionId } from "./types";

export interface ReviewEntry {
  questionId: QuestionId;
  /** 別々の回で続けて正解した数 */
  streak: number;
  /** これまでに間違えた回数（全期間） */
  wrongCount: number;
}

/** 解答記録を古い順に並べる（同時刻なら id 順で安定させる） */
export function sortAttempts(attempts: readonly Attempt[]): Attempt[] {
  return [...attempts].sort(
    (a, b) =>
      Date.parse(a.answeredAt) - Date.parse(b.answeredAt) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/** 問題ごとの最後の解答（○なら true）。一度も解いていない問題は入らない */
export function latestResults(
  attempts: readonly Attempt[],
): Map<QuestionId, boolean> {
  const latest = new Map<QuestionId, boolean>();
  for (const a of sortAttempts(attempts)) latest.set(a.questionId, a.correct);
  return latest;
}

/**
 * 解答記録から復習リストを計算する（仕様書 6.1、6.4）。卒業した問題は含まない。
 * - × でリストに入る（連続正解 0）
 * - リストにある問題に ○ で連続正解 +1、graduateStreak に達したら外れる
 * - 日付は使わない
 */
export function computeReview(
  attempts: readonly Attempt[],
  graduateStreak: number,
): Map<QuestionId, ReviewEntry> {
  const list = new Map<QuestionId, ReviewEntry>();
  const wrongs = new Map<QuestionId, number>();
  for (const a of sortAttempts(attempts)) {
    if (!a.correct) {
      const w = (wrongs.get(a.questionId) ?? 0) + 1;
      wrongs.set(a.questionId, w);
      list.set(a.questionId, {
        questionId: a.questionId,
        streak: 0,
        wrongCount: w,
      });
      continue;
    }
    const entry = list.get(a.questionId);
    if (!entry) continue;
    const streak = entry.streak + 1;
    if (streak >= graduateStreak) list.delete(a.questionId);
    else list.set(a.questionId, { ...entry, streak });
  }
  return list;
}

/** 連続正解の数ごとの件数（ホーム画面の内訳。仕様書 6.3） */
export function reviewBreakdown(
  review: ReadonlyMap<QuestionId, ReviewEntry>,
  graduateStreak: number,
): number[] {
  const counts = Array.from({ length: graduateStreak }, () => 0);
  for (const e of review.values())
    counts[e.streak] = (counts[e.streak] ?? 0) + 1;
  return counts;
}
