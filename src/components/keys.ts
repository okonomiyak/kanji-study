/**
 * 画面のキーボード操作を無視すべきか（文字入力中、ダイアログ表示中、修飾キーつき）。
 * 解答画面・採点画面で共通に使う。
 */
export function shouldIgnoreKey(
  e: KeyboardEvent,
  { allowModifiers = false } = {},
): boolean {
  if (e.isComposing || e.defaultPrevented) return true;
  if (!allowModifiers && (e.ctrlKey || e.metaKey || e.altKey)) return true;
  const t = e.target as HTMLElement | null;
  if (
    t &&
    (["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable)
  )
    return true;
  return document.querySelector('[role="dialog"]') !== null;
}

/** 手書きの「1つ戻す」（Ctrl/⌘+Z）と「やり直す」（Ctrl/⌘+Shift+Z、Ctrl+Y）のキーか */
export function inkShortcut(e: KeyboardEvent): "undo" | "redo" | null {
  if (!(e.ctrlKey || e.metaKey)) return null;
  const k = e.key.toLowerCase();
  if (k === "y" || (k === "z" && e.shiftKey)) return "redo";
  if (k === "z") return "undo";
  return null;
}
