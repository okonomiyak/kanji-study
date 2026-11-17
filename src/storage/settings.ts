import { sanitizeRange } from "../domain/range";
import type { RangeSpec } from "../domain/types";
import { PEN_WIDTHS, type PenWidth } from "../handwriting/strokes";

/** 端末ごとの設定（localStorage）。JSONの書き出しには含めない（仕様書 7.3） */
export interface Settings {
  penWidth: PenWidth;
  penOnly: boolean;
  /** 最後に使った出題範囲（仕様書 9.4） */
  lastRange: RangeSpec | null;
  /** 最後に選んだ問題数 */
  lastCount: number;
}

const KEY = "kanji-study:settings";

export const DEFAULT_SETTINGS: Settings = {
  penWidth: "normal",
  penOnly: false,
  lastRange: null,
  lastCount: 10,
};

/** 読めない・壊れているときは初期値に戻す */
export function loadSettings(
  storage: Storage | undefined = globalThis.localStorage,
): Settings {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const v = JSON.parse(raw) as Record<string, unknown>;
    return {
      penWidth:
        typeof v.penWidth === "string" && v.penWidth in PEN_WIDTHS
          ? (v.penWidth as PenWidth)
          : DEFAULT_SETTINGS.penWidth,
      penOnly:
        typeof v.penOnly === "boolean" ? v.penOnly : DEFAULT_SETTINGS.penOnly,
      lastRange: sanitizeRange(v.lastRange),
      lastCount:
        typeof v.lastCount === "number" && v.lastCount >= 1
          ? Math.floor(v.lastCount)
          : DEFAULT_SETTINGS.lastCount,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(
  settings: Settings,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // プライベートモードなどで保存できなくても動かす
  }
}
