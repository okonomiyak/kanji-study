/** 問題ID。「回の番号-問題番号」（例: "49-1"）。仕様書 9.3 */
export type QuestionId = string;

export interface Question {
  id: QuestionId;
  /** 回の番号（教材の「第49回」） */
  round: number;
  /** 回の中の問題番号 */
  number: number;
  /** 模範解答（送りがなを含む） */
  kanji: string;
  /** 例文の中で太字にする読み（カタカナ） */
  yomi: string;
  /** 例文 */
  furu: string;
  /** 意味の説明 */
  imi: string;
}

/** 通常出題か復習か */
export type Mode = "normal" | "review";

/** 1問の解答記録（仕様書 5.2） */
export interface Attempt {
  id: string;
  questionId: QuestionId;
  sessionId: string;
  mode: Mode;
  correct: boolean;
  /** 採点を確定した日時（ISO 8601） */
  answeredAt: string;
}

/** 1回の出題の記録 */
export interface Session {
  id: string;
  startedAt: string;
  finishedAt?: string;
  mode: Mode;
  count: number;
  range?: RangeSpec;
}

/** 問題の位置（回と番号） */
export interface QuestionRef {
  round: number;
  number: number;
}

/** 出題範囲（仕様書 9.4）。spans と rounds の和集合 */
export interface RangeSpec {
  /** 始まりと終わりを指定（両端を含む） */
  spans: { from: QuestionRef; to: QuestionRef }[];
  /** 回をまるごと選ぶ */
  rounds: number[];
}
