import { compareRefs, listRounds } from "./questions";
import type { Question, QuestionId, RangeSpec } from "./types";

export const EMPTY_RANGE: RangeSpec = { spans: [], rounds: [] };

/**
 * 範囲に入る問題のIDを、問題の並び順で重複なく返す（仕様書 9.4）。
 * spans は両端を含み、間の回はすべて含む。from と to が逆でも受け付ける。
 */
export function resolveRange(
  questions: readonly Question[],
  range: RangeSpec,
): QuestionId[] {
  const rounds = new Set(range.rounds);
  const spans = range.spans.map(({ from, to }) =>
    compareRefs(from, to) <= 0 ? { from, to } : { from: to, to: from },
  );
  return questions
    .filter(
      (q) =>
        rounds.has(q.round) ||
        spans.some(
          (s) => compareRefs(s.from, q) <= 0 && compareRefs(q, s.to) <= 0,
        ),
    )
    .map((q) => q.id);
}

export function isEmptyRange(range: RangeSpec): boolean {
  return range.spans.length === 0 && range.rounds.length === 0;
}

/** 範囲の短い説明（例: "第49回5番〜第50回3番、第53回"） */
export function describeRange(range: RangeSpec): string {
  const parts = [
    ...range.spans.map(
      ({ from, to }) =>
        `第${from.round}回${from.number}番〜第${to.round}回${to.number}番`,
    ),
    ...[...range.rounds].sort((a, b) => a - b).map((r) => `第${r}回`),
  ];
  return parts.length ? parts.join("、") : "（なし）";
}

/** 保存された値を検査して RangeSpec にする。壊れていれば null。 */
export function sanitizeRange(value: unknown): RangeSpec | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const isRef = (r: unknown): r is { round: number; number: number } =>
    typeof r === "object" &&
    r !== null &&
    Number.isInteger((r as Record<string, unknown>).round) &&
    Number.isInteger((r as Record<string, unknown>).number);
  if (!Array.isArray(v.spans) || !Array.isArray(v.rounds)) return null;
  const spans = (v.spans as unknown[]).filter(
    (s): s is RangeSpec["spans"][number] =>
      typeof s === "object" &&
      s !== null &&
      isRef((s as Record<string, unknown>).from) &&
      isRef((s as Record<string, unknown>).to),
  );
  const rounds = (v.rounds as unknown[]).filter((r): r is number =>
    Number.isInteger(r),
  );
  return {
    spans: spans.map((s) => ({
      from: { round: s.from.round, number: s.from.number },
      to: { round: s.to.round, number: s.to.number },
    })),
    rounds,
  };
}

/** 問題に出てくるすべての回を選んだ範囲 */
export function allRoundsRange(questions: readonly Question[]): RangeSpec {
  return { spans: [], rounds: listRounds(questions) };
}
