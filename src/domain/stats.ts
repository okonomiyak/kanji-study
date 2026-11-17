import { parseQuestionId } from "./questions";
import { sortAttempts } from "./review";
import type { Attempt, Question, QuestionId } from "./types";

export interface QuestionStats {
  questionId: QuestionId;
  /** 問題データに無い（削除された）問題なら undefined。仕様書 7.6 */
  question: Question | undefined;
  total: number;
  correct: number;
  wrong: number;
  /** 正答率（0〜1）。解答なしは 0 */
  rate: number;
  /** ○×の履歴（古い順） */
  history: boolean[];
}

export interface RoundStats {
  round: number;
  total: number;
  correct: number;
  rate: number;
}

export interface OverallStats {
  total: number;
  correct: number;
  rate: number;
  /** 直近の回（sessionId）の結果 */
  lastSession: {
    sessionId: string;
    total: number;
    correct: number;
    answeredAt: string;
  } | null;
}

const rate = (correct: number, total: number) =>
  total === 0 ? 0 : correct / total;

/** 漢字（問題）ごとの集計。解答のある問題だけを、問題の並び順（削除された問題は最後）で返す */
export function statsByQuestion(
  attempts: readonly Attempt[],
  questions: readonly Question[],
): QuestionStats[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const map = new Map<QuestionId, QuestionStats>();
  for (const a of sortAttempts(attempts)) {
    let s = map.get(a.questionId);
    if (!s) {
      s = {
        questionId: a.questionId,
        question: byId.get(a.questionId),
        total: 0,
        correct: 0,
        wrong: 0,
        rate: 0,
        history: [],
      };
      map.set(a.questionId, s);
    }
    s.total++;
    if (a.correct) s.correct++;
    else s.wrong++;
    s.history.push(a.correct);
  }
  const order = new Map(questions.map((q, i) => [q.id, i]));
  return [...map.values()]
    .map((s) => ({ ...s, rate: rate(s.correct, s.total) }))
    .sort(
      (a, b) =>
        (order.get(a.questionId) ?? Infinity) -
          (order.get(b.questionId) ?? Infinity) ||
        a.questionId.localeCompare(b.questionId),
    );
}

/** 回（第49回など）ごとの集計。問題IDから回を取る */
export function statsByRound(attempts: readonly Attempt[]): RoundStats[] {
  const map = new Map<number, RoundStats>();
  for (const a of attempts) {
    const ref = parseQuestionId(a.questionId);
    if (!ref) continue;
    const s = map.get(ref.round) ?? {
      round: ref.round,
      total: 0,
      correct: 0,
      rate: 0,
    };
    s.total++;
    if (a.correct) s.correct++;
    map.set(ref.round, s);
  }
  return [...map.values()]
    .map((s) => ({ ...s, rate: rate(s.correct, s.total) }))
    .sort((a, b) => a.round - b.round);
}

export function overallStats(attempts: readonly Attempt[]): OverallStats {
  const correct = attempts.filter((a) => a.correct).length;
  const sorted = sortAttempts(attempts);
  const last = sorted[sorted.length - 1];
  let lastSession: OverallStats["lastSession"] = null;
  if (last) {
    const inSession = attempts.filter((a) => a.sessionId === last.sessionId);
    lastSession = {
      sessionId: last.sessionId,
      total: inSession.length,
      correct: inSession.filter((a) => a.correct).length,
      answeredAt: last.answeredAt,
    };
  }
  return {
    total: attempts.length,
    correct,
    rate: rate(correct, attempts.length),
    lastSession,
  };
}

/**
 * 苦手な漢字（仕様書 5.3）。minAttempts 回以上解いた問題を、正答率の低い順、
 * 同率なら間違えた回数の多い順に並べる。正答率100%の問題は含めない。
 */
export function weakQuestions(
  stats: readonly QuestionStats[],
  minAttempts: number,
): QuestionStats[] {
  return stats
    .filter((s) => s.total >= minAttempts && s.wrong > 0)
    .sort(
      (a, b) =>
        a.rate - b.rate ||
        b.wrong - a.wrong ||
        a.questionId.localeCompare(b.questionId),
    );
}
