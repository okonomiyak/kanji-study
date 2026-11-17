<script lang="ts">
  import { renderOps, setupCanvas } from "./renderer";
  import type { Op } from "./strokes";

  /** 手書きを表示だけする（採点画面など） */
  let {
    ops,
    size,
    label = "自分の手書き",
  }: { ops: Op[]; size: number; label?: string } = $props();
  let canvas: HTMLCanvasElement;

  $effect(() => {
    if (size <= 0) return;
    renderOps(setupCanvas(canvas, size, window.devicePixelRatio || 1), ops);
  });
</script>

<div role="img" aria-label={label} class="inline-block leading-none">
  <canvas
    bind:this={canvas}
    class="rounded-xl border-2 border-stone-300 bg-white"
    style:width="{size}px"
    style:height="{size}px"
  ></canvas>
</div>
