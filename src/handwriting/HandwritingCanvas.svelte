<script lang="ts">
  import { onMount } from "svelte";
  import { attachInput } from "./input";
  import { drawSegment, renderOps, setupCanvas } from "./renderer";
  import { addOp, type Op, type Tool } from "./strokes";

  interface Props {
    ops: Op[];
    tool: Tool;
    width: number;
    penOnly: boolean;
    onchange: (ops: Op[]) => void;
    label?: string;
  }

  let {
    ops,
    tool,
    width,
    penOnly,
    onchange,
    label = "手書きの欄",
  }: Props = $props();

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let size = $state(0);

  // 空いている場所に収まる最大の正方形（設計計画書 4.2）
  onMount(() => {
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width: w, height: h } = entry.contentRect;
      size = Math.floor(Math.min(w, h));
    });
    ro.observe(container);
    const detach = attachInput(canvas, {
      getTool: () => tool,
      getWidth: () => width,
      getPenOnly: () => penOnly,
      onProgress: (op, from) => ctx && drawSegment(ctx, op, from),
      onStrokeEnd: (op) => onchange(addOp(ops, op)),
    });
    return () => {
      ro.disconnect();
      detach();
    };
  });

  // 大きさ・操作の列が変わったら全部描き直す
  $effect(() => {
    if (size <= 0) return;
    ctx = setupCanvas(canvas, size, window.devicePixelRatio || 1);
    renderOps(ctx, ops);
  });
</script>

<div
  bind:this={container}
  class="flex h-full w-full items-center justify-center"
>
  <canvas
    bind:this={canvas}
    aria-label={label}
    class="touch-none rounded-xl border-2 border-stone-300 bg-white shadow-inner select-none"
    style:width="{size}px"
    style:height="{size}px"
    style:-webkit-user-select="none"
    style:-webkit-touch-callout="none"
  ></canvas>
</div>
