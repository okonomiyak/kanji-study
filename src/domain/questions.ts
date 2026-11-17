import type { Question, QuestionId, QuestionRef } from "./types";

export function makeQuestionId(round: number, number: number): QuestionId {
  return `${round}-${number}`;
}

export function parseQuestionId(id: QuestionId): QuestionRef | null {
  const m = /^(\d+)-(\d+)$/.exec(id);
  if (!m) return null;
  return { round: Number(m[1]), number: Number(m[2]) };
}

/** 回の番号、問題番号の順に並べる比較関数 */
export function compareRefs(a: QuestionRef, b: QuestionRef): number {
  return a.round - b.round || a.number - b.number;
}

/** 部分文字列が何回出てくるか */
export function countOccurrences(text: string, sub: string): number {
  if (!sub) return 0;
  let n = 0;
  let i = text.indexOf(sub);
  while (i >= 0) {
    n++;
    i = text.indexOf(sub, i + sub.length);
  }
  return n;
}

export interface ParseResult {
  questions: Question[];
  errors: string[];
}

const FIELDS = ["kanji", "yomi", "furu", "imi"] as const;

/**
 * 問題データ（{"回":{"番号":{kanji,yomi,furu,imi}}}）を検査し、並べた一覧にする（仕様書 9.2）。
 * 不正な問題はエラーに入れて除く。
 */
export function parseQuestions(raw: unknown): ParseResult {
  const errors: string[] = [];
  const questions: Question[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { questions, errors: ["問題データがオブジェクトではありません"] };
  }
  for (const [roundKey, items] of Object.entries(raw)) {
    if (!/^\d+$/.test(roundKey)) {
      errors.push(`回の番号が数字ではありません: "${roundKey}"`);
      continue;
    }
    if (typeof items !== "object" || items === null || Array.isArray(items)) {
      errors.push(`第${roundKey}回の中身がオブジェクトではありません`);
      continue;
    }
    for (const [numKey, item] of Object.entries(
      items as Record<string, unknown>,
    )) {
      const id = `${roundKey}-${numKey}`;
      if (!/^\d+$/.test(numKey)) {
        errors.push(`${id}: 問題番号が数字ではありません`);
        continue;
      }
      if (typeof item !== "object" || item === null) {
        errors.push(`${id}: 問題がオブジェクトではありません`);
        continue;
      }
      const rec = item as Record<string, unknown>;
      const missing = FIELDS.filter(
        (f) => typeof rec[f] !== "string" || rec[f] === "",
      );
      if (missing.length > 0) {
        errors.push(`${id}: ${missing.join(", ")} がありません`);
        continue;
      }
      const q: Question = {
        id: makeQuestionId(Number(roundKey), Number(numKey)),
        round: Number(roundKey),
        number: Number(numKey),
        kanji: rec.kanji as string,
        yomi: rec.yomi as string,
        furu: rec.furu as string,
        imi: rec.imi as string,
      };
      const n = countOccurrences(q.furu, q.yomi);
      if (n !== 1) {
        errors.push(
          `${q.id}: yomi「${q.yomi}」が furu に ${n} 回出てきます（ちょうど1回が必要）`,
        );
        continue;
      }
      questions.push(q);
    }
  }
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) errors.push(`${q.id}: IDが重複しています`);
    seen.add(q.id);
  }
  questions.sort(compareRefs);
  return { questions, errors };
}

/** 回の番号の一覧（昇順） */
export function listRounds(questions: readonly Question[]): number[] {
  return [...new Set(questions.map((q) => q.round))].sort((a, b) => a - b);
}
