<script lang="ts" module>
  // Material Symbols（Rounded, weight 400）の SVG を同梱して使う。外部への通信なしでオフラインでも出る
  import stylus from "@material-symbols/svg-400/rounded/stylus.svg?raw";
  import inkEraser from "@material-symbols/svg-400/rounded/ink_eraser.svg?raw";
  import undo from "@material-symbols/svg-400/rounded/undo.svg?raw";
  import redo from "@material-symbols/svg-400/rounded/redo.svg?raw";
  import deleteSweep from "@material-symbols/svg-400/rounded/delete_sweep.svg?raw";

  const icons = {
    pen: stylus,
    eraser: inkEraser,
    undo,
    redo,
    clear: deleteSweep,
  } as const;
  export type IconName = keyof typeof icons;
</script>

<script lang="ts">
  let { name, class: cls = "size-6" }: { name: IconName; class?: string } =
    $props();
  // 大きさは class で決め、色は文字色に合わせる
  const svg = $derived(
    icons[name]
      .replace(/\s(width|height)="\d+"/g, "")
      .replace("<svg ", '<svg fill="currentColor" aria-hidden="true" '),
  );
</script>

<span class="inline-flex shrink-0 {cls} [&>svg]:size-full">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- 同梱の固定の SVG だけを入れる -->
  {@html svg}
</span>
