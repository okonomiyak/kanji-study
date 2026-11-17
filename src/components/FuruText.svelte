<script lang="ts">
  import { splitFuru } from "../domain/furu";

  /** 例文。yomi の部分を太字にする（仕様書 9.1）。vertical なら縦書き */
  let {
    furu,
    yomi,
    vertical = false,
    class: cls = "",
  }: {
    furu: string;
    yomi: string;
    vertical?: boolean;
    class?: string;
  } = $props();
  const parts = $derived(splitFuru(furu, yomi));
</script>

<p
  class="leading-relaxed break-words {vertical ? 'tategaki' : ''} {cls}"
  data-testid="furu"
>
  {parts.before}<strong
    class="font-black text-stone-950 underline decoration-amber-400 decoration-4 underline-offset-4"
    >{parts.bold}</strong
  >{parts.after}
</p>
