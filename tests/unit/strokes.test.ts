import { describe, expect, it } from "vitest";
import {
  addOp,
  canUndo,
  clearAll,
  compactOps,
  hasInk,
  normalizePoint,
  sanitizeOps,
  undo,
  visibleOps,
  type Op,
  type StrokeOp,
} from "../../src/handwriting/strokes";

const pen = (x = 0.1): StrokeOp => ({
  type: "pen",
  width: 0.02,
  points: [{ x, y: x }],
});
const eraser: StrokeOp = {
  type: "eraser",
  width: 0.08,
  points: [{ x: 0.1, y: 0.1 }],
};

describe("strokes", () => {
  it("ペン・消しゴムを足し、1つ戻す", () => {
    let ops: Op[] = [];
    ops = addOp(ops, pen());
    ops = addOp(ops, eraser);
    expect(visibleOps(ops)).toHaveLength(2);
    ops = undo(ops);
    expect(ops).toEqual([pen()]);
    expect(canUndo(ops)).toBe(true);
    expect(canUndo([])).toBe(false);
    expect(undo([])).toEqual([]);
  });

  it("全部消すも1つ戻すで元に戻せる", () => {
    let ops: Op[] = [pen(0.1), pen(0.2)];
    ops = clearAll(ops);
    expect(visibleOps(ops)).toEqual([]);
    expect(hasInk(ops)).toBe(false);
    ops = undo(ops);
    expect(visibleOps(ops)).toHaveLength(2);
  });

  it("何も見えていないときの全部消すは操作を増やさない", () => {
    expect(clearAll([])).toEqual([]);
    expect(clearAll([pen(), { type: "clear" }])).toHaveLength(2);
  });

  it("全部消すの後に書いた線だけが見える", () => {
    const ops: Op[] = [pen(0.1), { type: "clear" }, pen(0.3)];
    expect(visibleOps(ops)).toEqual([pen(0.3)]);
    expect(hasInk(ops)).toBe(true);
    expect(hasInk([eraser])).toBe(false);
  });

  it("座標は一辺に対する割合（0〜1に収める）", () => {
    expect(normalizePoint(50, 25, 100)).toEqual({ x: 0.5, y: 0.25 });
    expect(normalizePoint(-5, 150, 100)).toEqual({ x: 0, y: 1 });
  });

  it("保存用に丸め、壊れた値を捨てる", () => {
    expect(
      compactOps([
        { type: "pen", width: 0.02, points: [{ x: 0.123456, y: 0.98765 }] },
      ]),
    ).toEqual([
      { type: "pen", width: 0.02, points: [{ x: 0.1235, y: 0.9877 }] },
    ]);
    expect(
      sanitizeOps([
        pen(),
        { type: "clear" },
        { type: "x" },
        null,
        { type: "pen", width: "a", points: [] },
      ]),
    ).toEqual([pen(), { type: "clear" }]);
    expect(sanitizeOps("x")).toEqual([]);
  });
});
