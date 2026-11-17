<script lang="ts">
  import CountPicker from "../../components/CountPicker.svelte";
  import { btn } from "../../components/buttons";
  import { pickReview } from "../../domain/picker";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { history } from "../../state/history.svelte";
  import { router } from "../../state/router.svelte";
  import { settings } from "../../state/settings.svelte";

  /** 復習の出題（仕様書 6.3）。連続正解の少ないもの、間違いの多いものを優先 */
  let wanted = $state(settings.value.lastCount);
  const entries = $derived([...history.review.values()]);
  const count = $derived(Math.min(wanted, entries.length));

  async function start() {
    if (count === 0) return;
    if (activeQuiz.pending) activeQuiz.pending = null;
    await activeQuiz.start(pickReview(entries, count, Math.random), "review");
    router.go("answer");
  }
</script>

<div class="mx-auto max-w-2xl space-y-6 p-4">
  <header class="flex items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-xl font-bold">復習する</h1>
  </header>

  <section class="rounded-2xl border border-stone-200 bg-white p-4">
    <p class="mb-1">
      復習リスト: <strong>{entries.length}</strong> 件
    </p>
    <p class="text-sm text-stone-500">
      {history.breakdown.map((n, i) => `連続正解 ${i}回: ${n}件`).join(" ／ ")}
    </p>
    <p class="mt-2 text-sm text-stone-500">
      別々の回で {history.breakdown.length} 回続けて正解すると、リストから外れます。
    </p>
  </section>

  {#if entries.length}
    <section class="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">問題数</h2>
      <CountPicker
        value={wanted}
        max={entries.length}
        onchange={(n) => (wanted = n)}
      />
    </section>
    <div class="flex justify-end">
      <button class={btn.primary} onclick={start}
        >{count} 問で復習を始める</button
      >
    </div>
  {:else}
    <p class="text-stone-600">
      復習する問題はありません。×が付いた問題がここに入ります。
    </p>
  {/if}
</div>
