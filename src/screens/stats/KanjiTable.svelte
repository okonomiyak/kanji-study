<script lang="ts">
  import { formatRate } from "../../domain/format";
  import type { QuestionStats } from "../../domain/stats";

  let { items }: { items: QuestionStats[] } = $props();
  let sortBy = $state<"order" | "rate">("order");
  const sorted = $derived(
    sortBy === "rate"
      ? [...items].sort((a, b) => a.rate - b.rate || b.wrong - a.wrong)
      : items,
  );
</script>

<div class="mb-2 flex gap-3 text-sm">
  <label class="flex items-center gap-1"
    ><input type="radio" value="order" bind:group={sortBy} /> 問題の順</label
  >
  <label class="flex items-center gap-1"
    ><input type="radio" value="rate" bind:group={sortBy} /> 正答率の低い順</label
  >
</div>
<div class="overflow-x-auto">
  <table class="w-full min-w-[32rem] rounded-2xl bg-white text-left">
    <thead class="text-sm text-stone-500">
      <tr>
        <th class="p-2">問題</th><th class="p-2">漢字</th><th class="p-2"
          >出題</th
        ><th class="p-2">正答</th>
        <th class="p-2">正答率</th><th class="p-2">履歴（古い順）</th>
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
          ><td class="p-2 text-stone-500" colspan="6">まだ記録がありません</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
</div>
