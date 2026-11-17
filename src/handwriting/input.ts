import { normalizePoint, type StrokeOp, type Tool } from "./strokes";

export interface InputOptions {
  getTool: () => Tool;
  getWidth: () => number;
  /** true なら Apple Pencil などのペン入力だけを受け付ける */
  getPenOnly: () => boolean;
  /** 書いている途中（点が増えるたび）。from は新しく増えた最初の点の位置 */
  onProgress: (op: StrokeOp, from: number) => void;
  /** 1画を書き終えた */
  onStrokeEnd: (op: StrokeOp) => void;
}

/**
 * Pointer Events を受けて点を集める（設計計画書 4.2）。保存はしない。
 * スクロール・拡大・長押しメニュー・文字選択を止める。戻り値は後片付けの関数。
 */
export function attachInput(
  canvas: HTMLCanvasElement,
  o: InputOptions,
): () => void {
  let current: StrokeOp | null = null;
  let pointerId: number | null = null;

  const toPoint = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return normalizePoint(e.clientX - r.left, e.clientY - r.top, r.width || 1);
  };

  const accept = (e: PointerEvent) => {
    if (o.getPenOnly() && e.pointerType !== "pen") return false;
    if (e.pointerType === "mouse" && e.button !== 0) return false;
    return true;
  };

  const down = (e: PointerEvent) => {
    e.preventDefault();
    if (current || !accept(e)) return;
    pointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    current = { type: o.getTool(), width: o.getWidth(), points: [toPoint(e)] };
    o.onProgress(current, 0);
  };

  const move = (e: PointerEvent) => {
    if (!current || e.pointerId !== pointerId) return;
    e.preventDefault();
    const events =
      typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const from = current.points.length;
    for (const ev of events.length ? events : [e])
      current.points.push(toPoint(ev));
    o.onProgress(current, from);
  };

  const up = (e: PointerEvent) => {
    if (!current || e.pointerId !== pointerId) return;
    e.preventDefault();
    const op = current;
    current = null;
    pointerId = null;
    o.onStrokeEnd(op);
  };

  const prevent = (e: Event) => e.preventDefault();
  // iOS Safari: 長押しの拡大鏡・ダブルタップ拡大・ピンチを止める
  const touchPrevent = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("contextmenu", prevent);
  canvas.addEventListener("selectstart", prevent);
  canvas.addEventListener("gesturestart", prevent);
  canvas.addEventListener("touchstart", touchPrevent, { passive: false });
  canvas.addEventListener("touchmove", touchPrevent, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("contextmenu", prevent);
    canvas.removeEventListener("selectstart", prevent);
    canvas.removeEventListener("gesturestart", prevent);
    canvas.removeEventListener("touchstart", touchPrevent);
    canvas.removeEventListener("touchmove", touchPrevent);
  };
}
