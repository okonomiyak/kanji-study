<script lang="ts">
  import CountPicker from "../../components/CountPicker.svelte";
  import Dialog from "../../components/Dialog.svelte";
  import { btn } from "../../components/buttons";
  import { pickRandom } from "../../domain/picker";
  import { EMPTY_RANGE, describeRange, resolveRange } from "../../domain/range";
  import type { RangeSpec } from "../../domain/types";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { questions } from "../../state/questions.svelte";
  import { router } from "../../state/router.svelte";
  import { settings } from "../../state/settings.svelte";
  import RangePicker from "./RangePicker.svelte";

  let range = $state<RangeSpec>(
    structuredClone($state.snapshot(settings.value.lastRange) ?? EMPTY_RANGE),
  );
  let wanted = $state(settings.value.lastCount);
  let confirmReplace = $state(false);

  const ids = $derived(resolveRange(questions.list, range));
  const count = $derived(Math.min(wanted, ids.length));
  const hasActive = $derived(
    (activeQuiz.quiz !== null && activeQuiz.quiz.phase !== "confirmed") ||
      activeQuiz.pending !== null,
  );

  async function start(force = false) {
    if (count === 0) return;
    if (hasActive && !force) {
      confirmReplace = true;
      return;
    }
    confirmReplace = false;
    if (hasActive) {
      await activeQuiz.discard();
      activeQuiz.pending = null;
    }
    const snapshot = $state.snapshot(range) as RangeSpec;
    settings.update({ lastRange: snapshot, lastCount: wanted });
    await activeQuiz.start(
      pickRandom(ids, count, Math.random),
      "normal",
      snapshot,
    );
    router.go("answer");
  }
</script>

<div class="mx-auto max-w-3xl space-y-6 p-4 pb-24">
  <header class="flex items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-xl font-bold">出題の設定</h1>
  </header>

  <section class="rounded-2xl border border-stone-200 bg-white p-4">
    <h2 class="mb-3 text-lg font-bold">出題範囲</h2>
    <RangePicker
      questions={questions.list}
      {range}
      onchange={(r) => (range = r)}
    />
    <p class="mt-4 text-stone-600">
      範囲: {describeRange(range)} ／
      <strong data-testid="range-count">{ids.length}</strong> 問
    </p>
  </section>

  <section class="rounded-2xl border border-stone-200 bg-white p-4">
    <h2 class="mb-3 text-lg font-bold">問題数</h2>
    <CountPicker
      value={wanted}
      max={ids.length}
      onchange={(n) => (wanted = n)}
    />
  </section>

  <div class="flex justify-end">
    <button class={btn.primary} disabled={count === 0} onclick={() => start()}>
      {count} 問で始める
    </button>
  </div>
</div>

<Dialog open={confirmReplace} title="途中の回があります">
  採点が終わっていない回があります。破棄して新しく始めますか？（破棄した回は統計に記録されません）
  {#snippet actions()}
    <button class={btn.secondary} onclick={() => (confirmReplace = false)}
      >やめる</button
    >
    <button class={btn.danger} onclick={() => start(true)}
      >破棄して始める</button
    >
  {/snippet}
</Dialog>
