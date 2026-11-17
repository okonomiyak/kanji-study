<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * 解答画面の並び（仕様書 3.4）。
   * 縦向き: 上から「見出し・道具・本文・キャンバス・移動ボタン」。本文は縦書きなので高さを決めておく。
   * 横向き: キャンバスを左に高さいっぱいで置き、右の列に見出し・道具・本文・移動ボタンをまとめる。
   */
  interface Props {
    header: Snippet;
    tools: Snippet;
    text: Snippet;
    canvas: Snippet;
    nav: Snippet;
  }
  let { header, tools, text, canvas, nav }: Props = $props();
</script>

<div
  class="flex h-dvh flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] landscape:grid landscape:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] landscape:grid-rows-[auto_auto_1fr_auto]"
>
  <div class="landscape:col-start-2 landscape:row-start-1">
    {@render header()}
  </div>
  <div class="landscape:col-start-2 landscape:row-start-2">
    {@render tools()}
  </div>
  <div
    class="min-h-0 portrait:h-[28%] portrait:shrink-0 landscape:col-start-2 landscape:row-start-3"
  >
    {@render text()}
  </div>
  <div
    class="min-h-0 portrait:flex-1 landscape:col-start-1 landscape:row-span-4 landscape:row-start-1"
  >
    {@render canvas()}
  </div>
  <div class="landscape:col-start-2 landscape:row-start-4">{@render nav()}</div>
</div>
