import { visibleOps, type Op, type Point, type StrokeOp } from "./strokes";

export const INK_COLOR = "#111111";

/** canvas の画素数を、表示の大きさ（CSS px）と画素密度に合わせる */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  size: number,
  dpr: number,
): CanvasRenderingContext2D {
  const px = Math.max(1, Math.round(size * dpr));
  if (canvas.width !== px) canvas.width = px;
  if (canvas.height !== px) canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d が使えません");
  ctx.setTransform(px, 0, 0, px, 0, 0); // 以降は 0〜1 の座標で描く
  return ctx;
}

function applyStyle(ctx: CanvasRenderingContext2D, op: StrokeOp) {
  ctx.globalCompositeOperation =
    op.type === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = INK_COLOR;
  ctx.lineWidth = op.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

/** 1本の線を描く。中点を結ぶ二次曲線でなめらかにする */
export function drawStroke(ctx: CanvasRenderingContext2D, op: StrokeOp) {
  const pts = op.points;
  const first = pts[0];
  if (!first) return;
  applyStyle(ctx, op);
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(first.x, first.y, op.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i] as Point;
    const n = pts[i + 1] as Point;
    ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2);
  }
  const last = pts[pts.length - 1] as Point;
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/** 書いている途中の線の、新しく増えた区間だけを描く（全体を描き直さないので速い） */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  op: StrokeOp,
  from: number,
) {
  const pts = op.points;
  applyStyle(ctx, op);
  ctx.beginPath();
  const start = pts[Math.max(0, from - 1)];
  if (!start) return;
  ctx.moveTo(start.x, start.y);
  for (let i = Math.max(1, from); i < pts.length; i++) {
    const p = pts[i] as Point;
    ctx.lineTo(p.x, p.y);
  }
  if (pts.length === 1) {
    ctx.arc(start.x, start.y, op.width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else ctx.stroke();
}

/** 操作の列を全部描き直す */
export function renderOps(ctx: CanvasRenderingContext2D, ops: readonly Op[]) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, 1, 1);
  ctx.restore();
  for (const op of visibleOps(ops)) drawStroke(ctx, op);
  ctx.globalCompositeOperation = "source-over";
}
