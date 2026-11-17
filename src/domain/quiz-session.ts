import type { Attempt, Mode, QuestionId, RangeSpec, Session } from "./types";

/**
 * 1回の出題の状態（設計計画書 4.2）。
 * answering ──finish──▶ grading ──confirm──▶ confirmed
 * 手書きのデータ本体は持たない（handwriting と storage の担当）。
 */
export type QuizPhase = "answering" | "grading" | "confirmed";

export interface QuizState {
  sessionId: string;
  mode: Mode;
  startedAt: string;
  range?: RangeSpec;
  questionIds: QuestionId[];
  /** 解答中・採点中に表示している問題の位置 */
  index: number;
  phase: QuizPhase;
  /** 各問題の ○(true) / ×(false) / 未採点(null) */
  grades: (boolean | null)[];
}

export interface StartOptions {
  sessionId: string;
  mode: Mode;
  startedAt: string;
  questionIds: readonly QuestionId[];
  range?: RangeSpec;
}

export function startQuiz(o: StartOptions): QuizState {
  if (o.questionIds.length === 0) throw new Error("問題が1問もありません");
  return {
    sessionId: o.sessionId,
    mode: o.mode,
    startedAt: o.startedAt,
    ...(o.range ? { range: o.range } : {}),
    questionIds: [...o.questionIds],
    index: 0,
    phase: "answering",
    grades: o.questionIds.map(() => null),
  };
}

export function goTo(state: QuizState, index: number): QuizState {
  if (state.phase === "confirmed") return state;
  const i = Math.max(0, Math.min(state.questionIds.length - 1, index));
  return { ...state, index: i };
}

/** 未記入の問題の位置（確認は画面が出す）。hasInk[i] は i 問目に何か書いてあるか */
export function blankIndices(hasInk: readonly boolean[]): number[] {
  return hasInk.flatMap((ink, i) => (ink ? [] : [i]));
}

/** 解答を終えて採点に進む */
export function finish(state: QuizState): QuizState {
  if (state.phase !== "answering") return state;
  return { ...state, phase: "grading", index: 0 };
}

/** ○× を付ける（付け直しもできる） */
export function grade(
  state: QuizState,
  index: number,
  correct: boolean,
): QuizState {
  if (state.phase !== "grading" || index < 0 || index >= state.grades.length)
    return state;
  const grades = [...state.grades];
  grades[index] = correct;
  return { ...state, grades };
}

export function canConfirm(state: QuizState): boolean {
  return state.phase === "grading" && state.grades.every((g) => g !== null);
}

export interface ConfirmResult {
  state: QuizState;
  session: Session;
  attempts: Attempt[];
}

/** 採点を確定する。全問に ○× が付いていなければ null */
export function confirm(
  state: QuizState,
  answeredAt: string,
  makeId: () => string,
): ConfirmResult | null {
  if (!canConfirm(state)) return null;
  const attempts = state.questionIds.map<Attempt>((questionId, i) => ({
    id: makeId(),
    questionId,
    sessionId: state.sessionId,
    mode: state.mode,
    correct: state.grades[i] === true,
    answeredAt,
  }));
  const session: Session = {
    id: state.sessionId,
    startedAt: state.startedAt,
    finishedAt: answeredAt,
    mode: state.mode,
    count: state.questionIds.length,
    ...(state.range ? { range: state.range } : {}),
  };
  return { state: { ...state, phase: "confirmed" }, session, attempts };
}

/** × だった問題（「間違えた問題だけもう一度」用。仕様書 6.2） */
export function wrongQuestionIds(state: QuizState): QuestionId[] {
  return state.questionIds.filter((_, i) => state.grades[i] === false);
}
