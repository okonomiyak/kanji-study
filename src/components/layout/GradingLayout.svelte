<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * 採点画面の並び（仕様書 3.4、4.1）。基本は「意味・漢字と手書き・本文」の3列。
   * スマホ縦向きだけ「本文 → 漢字と手書き（横並び） → 意味」の縦積み。
   */
  let {
    meaning,
    answer,
    text,
  }: { meaning: Snippet; answer: Snippet; text: Snippet } = $props();
</script>

<div
  class="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 max-md:portrait:flex max-md:portrait:flex-col max-md:portrait:items-stretch"
>
  <section class="max-md:portrait:order-3">{@render meaning()}</section>
  <section
    class="flex flex-col items-center gap-2 max-md:portrait:order-2 max-md:portrait:flex-row max-md:portrait:justify-center"
  >
    {@render answer()}
  </section>
  <section class="max-md:portrait:order-1">{@render text()}</section>
</div>
