<script lang="ts">
  import { btn } from "../../components/buttons";
  import { shuffle } from "../../domain/random";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { history } from "../../state/history.svelte";
  import { questions } from "../../state/questions.svelte";
  import { router } from "../../state/router.svelte";
  import KanjiTable from "./KanjiTable.svelte";
  import WeakList from "./WeakList.svelte";

  const s = $derived(history.stats(questions.list));
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  let tab = $state<"weak" | "kanji" | "round">("weak");

  /** 選んだ漢字だけで出題（仕様書 5.3） */
  async function startWith(ids: string[]) {
    if (!ids.length) return;
    if (activeQuiz.pending) activeQuiz.pending = null;
    await activeQuiz.start(shuffle(ids, Math.random), "normal");
    router.go("answer");
  }
</script>

<div class="mx-auto max-w-4xl space-y-6 p-4 pb-16">
  <header class="flex items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-xl font-bold">統計</h1>
  </header>

  <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
    <div class="rounded-2xl border border-stone-200 bg-white p-4">
      <p class="text-sm text-stone-500">累計の解答</p>
      <p class="text-2xl font-bold" data-testid="total">{s.overall.total}</p>
    </div>
    <div class="rounded-2xl border border-stone-200 bg-white p-4">
      <p class="text-sm text-stone-500">正答率</p>
      <p class="text-2xl font-bold" data-testid="rate">
        {s.overall.total ? pct(s.overall.rate) : "—"}
      </p>
    </div>
    <div class="col-span-2 rounded-2xl border border-stone-200 bg-white p-4">
      <p class="text-sm text-stone-500">直近の出題</p>
      {#if s.overall.lastSession}
        <p class="text-2xl font-bold">
          {s.overall.lastSession.correct} / {s.overall.lastSession.total}
          <span class="text-sm font-normal text-stone-500">
            {new Date(s.overall.lastSession.answeredAt).toLocaleString("ja-JP")}
          </span>
        </p>
      {:else}
        <p class="text-stone-500">まだありません</p>
      {/if}
    </div>
  </section>

  <div class="flex gap-2" role="tablist">
    {#each [["weak", "苦手な漢字"], ["kanji", "漢字ごと"], ["round", "回ごと"]] as [k, label] (k)}
      <button
        role="tab"
        aria-selected={tab === k}
        class="min-h-11 rounded-lg border px-4 {tab === k
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-300 bg-white'}"
        onclick={() => (tab = k as typeof tab)}>{label}</button
      >
    {/each}
  </div>

  {#if tab === "weak"}
    <WeakList items={s.weak} onstart={startWith} />
  {:else if tab === "kanji"}
    <KanjiTable items={s.byQuestion} />
  {:else}
    <table class="w-full rounded-2xl bg-white text-left">
      <thead class="text-sm text-stone-500">
        <tr
          ><th class="p-2">回</th><th class="p-2">解答数</th><th class="p-2"
            >正答</th
          ><th class="p-2">正答率</th></tr
        >
      </thead>
      <tbody>
        {#each s.byRound as r (r.round)}
          <tr class="border-t border-stone-100">
            <td class="p-2">第{r.round}回</td><td class="p-2">{r.total}</td><td
              class="p-2">{r.correct}</td
            >
            <td class="p-2">{pct(r.rate)}</td>
          </tr>
        {:else}
          <tr
            ><td class="p-2 text-stone-500" colspan="4">まだ記録がありません</td
            ></tr
          >
        {/each}
      </tbody>
    </table>
  {/if}

  <p class="text-sm text-stone-500">
    <button class="{btn.small} text-sm" onclick={() => router.go("review")}
      >復習する</button
    >
  </p>
</div>
