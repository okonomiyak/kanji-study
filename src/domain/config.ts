/** 調整できる値の初期値（仕様書 12章） */
export const DEFAULT_CONFIG = {
  /** 復習リストから外れるのに必要な連続正解（別々の回で続けて正解した数） */
  graduateStreak: 2,
  /** バックアップ警告までの日数 */
  backupWarningDays: 7,
  /** 問題数の選択肢 */
  countChoices: [10, 20] as const,
  /** 苦手な漢字の対象になる最低解答回数 */
  weakMinAttempts: 2,
} as const;

export type Config = typeof DEFAULT_CONFIG;
