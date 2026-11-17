<script lang="ts">
  import { formatRate } from "../../domain/format";
  import { btn } from "../../components/buttons";
  import { DEFAULT_CONFIG } from "../../domain/config";
  import type { QuestionStats } from "../../domain/stats";

  /** 苦手な漢字（仕様書 5.3）。選んだものだけで出題できる */
  let {
    items,
    onstart,
  }: { items: QuestionStats[]; onstart: (ids: string[]) => void } = $props();
  let selected = $state<string[]>([]);
  const available = $derived(items.filter((s) => s.question));
</script>

{#if available.length}
  <div class="mb-3 flex flex-wrap items-center gap-2">
    <button
      class={btn.small}
      onclick={() => (selected = available.map((s) => s.questionId))}
      >全部選ぶ</button
    >
    <button class={btn.small} onclick={() => (selected = [])}>選択を外す</button
    >
    <button
      class={btn.primary}
      disabled={!selected.length}
      onclick={() => onstart([...selected])}
    >
      選んだ {selected.length} 問を出題
    </button>
  </div>
  <ul
    class="divide-y divide-stone-100 rounded-2xl bg-white"
    data-testid="weak-list"
  >
    {#each available as s (s.questionId)}
      <li>
        <label class="flex min-h-12 items-center gap-3 p-2">
          <input
            type="checkbox"
            class="size-5"
            value={s.questionId}
            bind:group={selected}
          />
          <span class="min-w-20 font-serif text-xl font-bold"
            >{s.question?.kanji}</span
          >
          <span class="text-stone-600"
            >{formatRate(s.rate)}（{s.correct}/{s.total}、×{s.wrong}）</span
          >
          <span class="ml-auto text-sm text-stone-400">{s.questionId}</span>
        </label>
      </li>
    {/each}
  </ul>
{:else}
  <p class="text-stone-600">
    まだありません。{DEFAULT_CONFIG.weakMinAttempts}回以上解いて、間違えたことのある問題がここに並びます。
  </p>
{/if}
