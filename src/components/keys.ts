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
