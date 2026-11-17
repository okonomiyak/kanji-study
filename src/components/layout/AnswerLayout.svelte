<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * 解答画面の並び（仕様書 3.4）。横向き: キャンバス左・本文右。縦向き: 本文上・キャンバス下。
   */
  let { text, canvas }: { text: Snippet; canvas: Snippet } = $props();
</script>

<div class="flex min-h-0 flex-1 gap-3 portrait:flex-col landscape:flex-row">
  <section
    class="min-h-0 portrait:order-2 portrait:flex-1 landscape:order-1 landscape:h-full landscape:flex-[3]"
  >
    {@render canvas()}
  </section>
  <section
    class="overflow-auto portrait:order-1 portrait:max-h-[35%] landscape:order-2 landscape:flex-[2] landscape:self-center"
  >
    {@render text()}
  </section>
</div>
