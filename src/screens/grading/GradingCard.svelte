<script lang="ts">
  import FuruText from "../../components/FuruText.svelte";
  import GradingLayout from "../../components/layout/GradingLayout.svelte";
  import InkView from "../../handwriting/InkView.svelte";
  import type { Op } from "../../handwriting/strokes";
  import type { Question } from "../../domain/types";

  /** 1問の採点（仕様書 4.1）: 左に意味、中央に正しい漢字（上）と手書き（下）、右に本文 */
  let { question, ops }: { question: Question; ops: Op[] } = $props();

  let box = $state({ w: 0, h: 0 });
  // 手書きの表示の大きさ: 画面の幅・高さに合わせる
  const inkSize = $derived(
    Math.max(96, Math.min(box.w * 0.34, box.h * 0.42, 360)),
  );
</script>

<div
  class="flex min-h-0 flex-1"
  bind:clientWidth={box.w}
  bind:clientHeight={box.h}
>
  <GradingLayout>
    {#snippet meaning()}
      <div class="rounded-2xl bg-white p-3">
        <p class="mb-1 text-xs text-stone-500">意味</p>
        <p class="text-base md:text-lg">{question.imi}</p>
      </div>
    {/snippet}
    {#snippet answer()}
      <div class="flex flex-col items-center">
        <p class="text-xs text-stone-500">正しい漢字</p>
        <p
          class="flex items-center justify-center font-serif leading-none font-bold"
          style:min-height="{inkSize * 0.6}px"
          style:font-size="{Math.min(
            inkSize / Math.max(question.kanji.length, 1),
            inkSize * 0.5,
          )}px"
          data-testid="correct-kanji"
        >
          {question.kanji}
        </p>
      </div>
      <div class="flex flex-col items-center">
        <p class="text-xs text-stone-500">自分の手書き</p>
        <InkView {ops} size={inkSize} />
      </div>
    {/snippet}
    {#snippet text()}
      <div class="rounded-2xl bg-white p-3 text-lg md:text-2xl">
        <FuruText furu={question.furu} yomi={question.yomi} />
      </div>
    {/snippet}
  </GradingLayout>
</div>
