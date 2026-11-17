<script lang="ts">
  import Icon, { type IconName } from "../../components/Icon.svelte";
  import type { Tool } from "../../handwriting/strokes";

  interface Props {
    tool: Tool;
    canUndo: boolean;
    canRedo: boolean;
    onTool: (tool: Tool) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
  }
  let { tool, canUndo, canRedo, onTool, onUndo, onRedo, onClear }: Props =
    $props();

  const base =
    "inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-lg border px-3 text-base font-medium select-none disabled:opacity-40 max-sm:min-w-14 max-sm:flex-col max-sm:gap-0 max-sm:px-1.5 max-sm:py-1 max-sm:text-[11px] max-sm:leading-tight";
  const on = "border-stone-900 bg-stone-900 text-white";
  const off = "border-stone-300 bg-white text-stone-800";
</script>

{#snippet item(icon: IconName, label: string, shortLabel: string)}
  <Icon name={icon} class="size-6" />
  <!-- 狭い画面ではアイコンの下に短い名前を出す -->
  <span class="max-sm:hidden">{label}</span><span
    class="sm:hidden"
    aria-hidden="true">{shortLabel}</span
  >
{/snippet}

<div
  class="flex flex-wrap gap-2 max-sm:gap-1.5"
  role="toolbar"
  aria-label="道具"
>
  <button
    class="{base} {tool === 'pen' ? on : off}"
    aria-pressed={tool === "pen"}
    aria-label="ペン"
    onclick={() => onTool("pen")}
  >
    {@render item("pen", "ペン", "ペン")}
  </button>
  <button
    class="{base} {tool === 'eraser' ? on : off}"
    aria-pressed={tool === "eraser"}
    aria-label="消しゴム"
    onclick={() => onTool("eraser")}
  >
    {@render item("eraser", "消しゴム", "消す")}
  </button>
  <button
    class="{base} {off}"
    disabled={!canUndo}
    aria-label="1つ戻す"
    title="1つ戻す（Ctrl/⌘+Z）"
    onclick={onUndo}
  >
    {@render item("undo", "1つ戻す", "戻す")}
  </button>
  <button
    class="{base} {off}"
    disabled={!canRedo}
    aria-label="やり直す"
    title="やり直す（Ctrl/⌘+Shift+Z）"
    onclick={onRedo}
  >
    {@render item("redo", "やり直す", "やり直す")}
  </button>
  <button class="{base} {off}" aria-label="全部消す" onclick={onClear}>
    {@render item("clear", "全部消す", "全消去")}
  </button>
</div>
