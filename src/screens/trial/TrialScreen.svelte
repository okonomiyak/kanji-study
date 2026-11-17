<script lang="ts">
  import HandwritingCanvas from "../../handwriting/HandwritingCanvas.svelte";
  import {
    ERASER_WIDTH,
    PEN_WIDTHS,
    canUndo,
    clearAll,
    redoStep,
    undoStep,
    type InkHistory,
    type Op,
    type Tool,
  } from "../../handwriting/strokes";
  import { renderOps, setupCanvas } from "../../handwriting/renderer";
  import ToolBar from "../answer/ToolBar.svelte";

  /** 試し書き（フェーズ3の確認用） */
  let ops = $state.raw<Op[]>([]);
  let redo = $state.raw<Op[]>([]);
  const apply = (h: InkHistory) => ({ ops, redo } = h);
  let tool = $state<Tool>("pen");
  let penOnly = $state(false);
  let lastRenderMs = $state(0);

  function measure() {
    const c = document.createElement("canvas");
    const t0 = performance.now();
    renderOps(setupCanvas(c, 600, window.devicePixelRatio || 1), ops);
    lastRenderMs = Math.round((performance.now() - t0) * 10) / 10;
  }
</script>

<div class="flex h-dvh flex-col gap-2 p-3">
  <div class="flex flex-wrap items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-lg font-bold">試し書き</h1>
    <label class="flex items-center gap-1 text-sm">
      <input type="checkbox" bind:checked={penOnly} /> ペン入力のみ
    </label>
    <button class="text-sm underline" onclick={measure}
      >描き直しの時間を測る</button
    >
    {#if lastRenderMs}<span class="text-sm text-stone-500"
        >{lastRenderMs} ms（{ops.length} 操作）</span
      >{/if}
  </div>
  <ToolBar
    {tool}
    canUndo={canUndo(ops)}
    canRedo={redo.length > 0}
    onTool={(t) => (tool = t)}
    onUndo={() => apply(undoStep(ops, redo))}
    onRedo={() => apply(redoStep(ops, redo))}
    onClear={() => apply({ ops: clearAll(ops), redo: [] })}
  />
  <div class="min-h-0 flex-1">
    <HandwritingCanvas
      {ops}
      {tool}
      width={tool === "pen" ? PEN_WIDTHS.normal : ERASER_WIDTH}
      {penOnly}
      onchange={(o) => apply({ ops: o, redo: [] })}
    />
  </div>
</div>
