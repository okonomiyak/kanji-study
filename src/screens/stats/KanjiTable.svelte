<script lang="ts">
  import { formatRate } from "../../domain/format";
  import {
    NO_FILTER,
    filterQuestionStats,
    roundsInStats,
    sortQuestionStats,
    type QuestionStats,
    type StatsFilter,
    type SortDir,
    type StatsSortKey,
  } from "../../domain/stats";

  let { items }: { items: QuestionStats[] } = $props();

  const keys: { key: StatsSortKey; label: string; first: SortDir }[] = [
    { key: "order", label: "問題の順", first: "asc" },
    { key: "rate", label: "正答率", first: "asc" },
    { key: "correct", label: "正答回数", first: "desc" },
    { key: "wrong", label: "間違えた回数", first: "desc" },
    { key: "total", label: "出題回数", first: "desc" },
  ];
  let sortKey = $state<StatsSortKey>("order");
  let sortDir = $state<SortDir>("asc");
  let filter = $state<StatsFilter>({ ...NO_FILTER });
  const rounds = $derived(roundsInStats(items));
  const sorted = $derived(
    sortQuestionStats(filterQuestionStats(items, filter), sortKey, sortDir),
  );
  const filtered = $derived(
    filter.round !== null || filter.result !== "all" || filter.query !== "",
  );

  /** 見出しを押したとき: 同じ列なら向きを変え、違う列ならその列のよく使う向きで並べる */
  function sortBy(key: StatsSortKey) {
    if (key === sortKey) sortDir = sortDir === "asc" ? "desc" : "asc";
    else {
      sortKey = key;
      sortDir = keys.find((k) => k.key === key)?.first ?? "asc";
    }
  }
  const ariaSort = (key: StatsSortKey) =>
    key === sortKey
      ? sortDir === "asc"
        ? "ascending"
        : "descending"
      : undefined;
  const arrow = (key: StatsSortKey) =>
    key === sortKey ? (sortDir === "asc" ? "▲" : "▼") : "";
</script>

{#snippet sortHeader(key: StatsSortKey, label: string)}
  <th class="p-0" aria-sort={ariaSort(key)}>
    <button
      class="flex w-full items-center gap-1 p-2 text-left hover:text-stone-900"
      onclick={() => sortBy(key)}
      >{label}<span class="w-3 text-xs">{arrow(key)}</span></button
    >
  </th>
{/snippet}

<div
  class="mb-2 flex flex-wrap items-center gap-2 text-sm"
  data-testid="kanji-filter"
>
  <label class="flex items-center gap-1"
    >回
    <select
      class="rounded-lg border border-stone-300 bg-white px-2 py-1"
      bind:value={filter.round}
      aria-label="回で絞り込む"
    >
      <option value={null}>すべての回</option>
      {#each rounds as r (r)}<option value={r}>第{r}回</option>{/each}
    </select></label
  >
  <label class="flex items-center gap-1"
    >結果
    <select
      class="rounded-lg border border-stone-300 bg-white px-2 py-1"
      bind:value={filter.result}
      aria-label="結果で絞り込む"
    >
      <option value="all">すべて</option>
      <option value="missed">間違えたことがある</option>
      <option value="perfect">全部正解</option>
    </select></label
  >
  <input
    type="search"
    class="w-40 rounded-lg border border-stone-300 bg-white px-2 py-1"
    placeholder="漢字・読みで探す"
    aria-label="漢字・読みで探す"
    bind:value={filter.query}
  />
  {#if filtered}
    <span class="text-stone-500" data-testid="filter-count"
      >{sorted.length} / {items.length} 件</span
    >
    <button class="underline" onclick={() => (filter = { ...NO_FILTER })}
      >絞り込みを外す</button
    >
  {/if}
</div>
<div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
  <label class="flex items-center gap-1"
    >並べ替え
    <select
      class="rounded-lg border border-stone-300 bg-white px-2 py-1"
      bind:value={sortKey}
      onchange={() =>
        (sortDir = keys.find((k) => k.key === sortKey)?.first ?? "asc")}
    >
      {#each keys as k (k.key)}<option value={k.key}>{k.label}</option>{/each}
    </select></label
  >
  <button
    class="rounded-lg border border-stone-300 bg-white px-2 py-1"
    onclick={() => (sortDir = sortDir === "asc" ? "desc" : "asc")}
    data-testid="sort-dir"
    >{sortDir === "asc"
      ? sortKey === "order"
        ? "前から ▲"
        : "少ない順 ▲"
      : sortKey === "order"
        ? "後ろから ▼"
        : "多い順 ▼"}</button
  >
</div>
<div class="overflow-x-auto">
  <table class="w-full min-w-[36rem] rounded-2xl bg-white text-left">
    <thead class="text-sm text-stone-500">
      <tr>
        {@render sortHeader("order", "問題")}
        <th class="p-2">漢字</th>
        {@render sortHeader("total", "出題")}
        {@render sortHeader("correct", "正答")}
        {@render sortHeader("wrong", "誤答")}
        {@render sortHeader("rate", "正答率")}
        <th class="p-2">履歴（古い順）</th>
      </tr>
    </thead>
    <tbody>
      {#each sorted as s (s.questionId)}
        <tr class="border-t border-stone-100">
          <td class="p-2 text-sm text-stone-500">{s.questionId}</td>
          <td class="p-2 font-serif text-xl font-bold"
            >{s.question?.kanji ?? "（削除された問題）"}</td
          >
          <td class="p-2">{s.total}</td>
          <td class="p-2">{s.correct}</td>
          <td class="p-2">{s.wrong}</td>
          <td class="p-2">{formatRate(s.rate)}</td>
          <td class="p-2 tracking-wider">
            {#each s.history.slice(-10) as h, i (i)}<span
                class={h ? "text-emerald-700" : "text-red-700"}
                >{h ? "○" : "×"}</span
              >{/each}
          </td>
        </tr>
      {:else}
        <tr
          ><td class="p-2 text-stone-500" colspan="7"
            >{items.length
              ? "条件に合う漢字がありません"
              : "まだ記録がありません"}</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
</div>
