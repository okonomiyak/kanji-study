/**
 * 手書きの操作の列（設計計画書 4.2 handwriting）。DOM を使わない純粋なデータ。
 * 座標と太さはキャンバスの一辺に対する割合（0〜1）で持つので、大きさが変わっても形は同じ。
 */

export interface Point {
  x: number;
  y: number;
}

export type Tool = "pen" | "eraser";

export interface StrokeOp {
  type: Tool;
  /** 線の太さ（一辺に対する割合） */
  width: number;
  points: Point[];
}

export interface ClearOp {
  type: "clear";
}

export type Op = StrokeOp | ClearOp;

/** 線の太さの選択肢（一辺に対する割合） */
export const PEN_WIDTHS = { thin: 0.01, normal: 0.016, thick: 0.026 } as const;
export type PenWidth = keyof typeof PEN_WIDTHS;
export const ERASER_WIDTH = 0.08;

export function addOp(ops: readonly Op[], op: Op): Op[] {
  return [...ops, op];
}

/** 直前の操作（ペン、消しゴム、全部消す）を1つ取り消す */
export function undo(ops: readonly Op[]): Op[] {
  return ops.slice(0, -1);
}

/** 全部消す。何も見えていないときは操作を増やさない */
export function clearAll(ops: readonly Op[]): Op[] {
  return visibleOps(ops).length === 0 ? [...ops] : [...ops, { type: "clear" }];
}

/** 最後の「全部消す」より後の操作（描き直しに使う） */
export function visibleOps(ops: readonly Op[]): StrokeOp[] {
  let start = 0;
  for (let i = ops.length - 1; i >= 0; i--) {
    if (ops[i]?.type === "clear") {
      start = i + 1;
      break;
    }
  }
  return ops.slice(start).filter((o): o is StrokeOp => o.type !== "clear");
}

/** 何か書いてあるか（ペンの線が1本でも見えていれば true。消しゴムで全部消した場合も true になる簡易判定） */
export function hasInk(ops: readonly Op[]): boolean {
  return visibleOps(ops).some((o) => o.type === "pen");
}

export function canUndo(ops: readonly Op[]): boolean {
  return ops.length > 0;
}

/** 戻した操作を覚えておく「やり直し」の列（最後が次にやり直す操作）。保存はしない */
export interface InkHistory {
  ops: Op[];
  redo: Op[];
}

/** 1つ戻し、戻した操作をやり直しの列に積む */
export function undoStep(ops: readonly Op[], redo: readonly Op[]): InkHistory {
  const last = ops[ops.length - 1];
  return last
    ? { ops: ops.slice(0, -1), redo: [...redo, last] }
    : { ops: [...ops], redo: [...redo] };
}

/** 戻した操作を1つやり直す */
export function redoStep(ops: readonly Op[], redo: readonly Op[]): InkHistory {
  const next = redo[redo.length - 1];
  return next
    ? { ops: [...ops, next], redo: redo.slice(0, -1) }
    : { ops: [...ops], redo: [...redo] };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 画面上の座標を割合にする */
export function normalizePoint(x: number, y: number, size: number): Point {
  return { x: clamp01(x / size), y: clamp01(y / size) };
}

/** 保存用に座標を丸める（小数第4位まで。1000px でも 0.1px の精度） */
export function compactOps(ops: readonly Op[]): Op[] {
  const r = (v: number) => Math.round(v * 10000) / 10000;
  return ops.map((o) =>
    o.type === "clear"
      ? o
      : { ...o, points: o.points.map((p) => ({ x: r(p.x), y: r(p.y) })) },
  );
}

/** 保存された値を検査する。壊れた操作は捨てる */
export function sanitizeOps(value: unknown): Op[] {
  if (!Array.isArray(value)) return [];
  const out: Op[] = [];
  for (const v of value) {
    if (typeof v !== "object" || v === null) continue;
    const o = v as Record<string, unknown>;
    if (o.type === "clear") out.push({ type: "clear" });
    else if (
      (o.type === "pen" || o.type === "eraser") &&
      typeof o.width === "number" &&
      Array.isArray(o.points)
    ) {
      const points = (o.points as unknown[]).filter(
        (p): p is Point =>
          typeof p === "object" &&
          p !== null &&
          typeof (p as Record<string, unknown>).x === "number" &&
          typeof (p as Record<string, unknown>).y === "number",
      );
      out.push({ type: o.type, width: o.width, points });
    }
  }
  return out;
}
