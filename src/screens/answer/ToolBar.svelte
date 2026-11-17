<script lang="ts">
  import type { Tool } from "../../handwriting/strokes";

  interface Props {
    tool: Tool;
    canUndo: boolean;
    onTool: (tool: Tool) => void;
    onUndo: () => void;
    onClear: () => void;
  }
  let { tool, canUndo, onTool, onUndo, onClear }: Props = $props();

  const base =
    "min-h-11 min-w-11 rounded-lg border px-3 text-base font-medium select-none";
  const on = "border-stone-900 bg-stone-900 text-white";
  const off = "border-stone-300 bg-white text-stone-800";
</script>

<div class="flex flex-wrap gap-2" role="toolbar" aria-label="道具">
  <button
    class="{base} {tool === 'pen' ? on : off}"
    aria-pressed={tool === "pen"}
    onclick={() => onTool("pen")}
  >
    ペン
  </button>
  <button
    class="{base} {tool === 'eraser' ? on : off}"
    aria-pressed={tool === "eraser"}
    onclick={() => onTool("eraser")}
  >
    消しゴム
  </button>
  <button
    class="{base} {off} disabled:opacity-40"
    disabled={!canUndo}
    onclick={onUndo}>1つ戻す</button
  >
  <button class="{base} {off}" onclick={onClear}>全部消す</button>
</div>
