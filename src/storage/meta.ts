/** 最後にJSONを書き出した日時など（localStorage） */
const LAST_EXPORT_KEY = "kanji-study:last-export-at";

export function getLastExportAt(
  storage: Storage | undefined = globalThis.localStorage,
): Date | null {
  try {
    const v = storage?.getItem(LAST_EXPORT_KEY);
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function setLastExportAt(
  date: Date,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(LAST_EXPORT_KEY, date.toISOString());
  } catch {
    // 保存できなくても動かす
  }
}
