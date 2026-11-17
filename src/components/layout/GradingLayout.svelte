<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * 採点画面の並び（仕様書 3.4、4.1）。基本は「意味・漢字と手書き・本文」の3列。
   * 本文と意味は縦書きなので、各列は高さいっぱいに伸ばす。
   * スマホ縦向きだけ、上の段に「意味（左）・本文（右）」、下の段に「漢字と手書き（横並び）」。
   */
  let {
    meaning,
    answer,
    text,
  }: { meaning: Snippet; answer: Snippet; text: Snippet } = $props();
</script>

<div
  class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-3 max-md:portrait:grid-cols-2 max-md:portrait:grid-rows-[minmax(0,1fr)_auto]"
>
  <section
    class="min-h-0 max-md:portrait:col-start-1 max-md:portrait:row-start-1"
  >
    {@render meaning()}
  </section>
  <section
    class="flex flex-col items-center justify-center gap-2 max-md:portrait:col-span-2 max-md:portrait:row-start-2 max-md:portrait:flex-row"
  >
    {@render answer()}
  </section>
  <section
    class="min-h-0 max-md:portrait:col-start-2 max-md:portrait:row-start-1"
  >
    {@render text()}
  </section>
</div>
