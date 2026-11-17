<script lang="ts">
  import { formatRate } from "../../domain/format";
  import {
    sortQuestionStats,
    type QuestionStats,
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
  const sorted = $derived(sortQuestionStats(items, sortKey, sortDir));

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
          ><td class="p-2 text-stone-500" colspan="7">まだ記録がありません</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
</div>
