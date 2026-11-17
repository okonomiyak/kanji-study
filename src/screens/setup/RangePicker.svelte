<script lang="ts">
  import { listRounds } from "../../domain/questions";
  import { resolveRange } from "../../domain/range";
  import type { Question, QuestionRef, RangeSpec } from "../../domain/types";
  import { btn } from "../../components/buttons";

  /** 出題範囲の指定（仕様書 9.4）。回の選択と「始まり〜終わり」を足し合わせられる */
  let {
    questions,
    range,
    onchange,
  }: {
    questions: Question[];
    range: RangeSpec;
    onchange: (r: RangeSpec) => void;
  } = $props();

  const rounds = $derived(listRounds(questions));
  const countIn = (round: number) =>
    questions.filter((q) => q.round === round).length;
  const numbersOf = (round: number) =>
    questions.filter((q) => q.round === round).map((q) => q.number);

  let fromRound = $state(0);
  let fromNumber = $state(0);
  let toRound = $state(0);
  let toNumber = $state(0);

  $effect(() => {
    if (!fromRound && rounds.length) {
      fromRound = rounds[0]!;
      toRound = rounds[0]!;
    }
  });
  $effect(() => {
    const ns = numbersOf(fromRound);
    if (!ns.includes(fromNumber)) fromNumber = ns[0] ?? 0;
  });
  $effect(() => {
    const ns = numbersOf(toRound);
    if (!ns.includes(toNumber)) toNumber = ns[ns.length - 1] ?? 0;
  });

  function toggleRound(r: number) {
    const has = range.rounds.includes(r);
    onchange({
      ...range,
      rounds: has
        ? range.rounds.filter((x) => x !== r)
        : [...range.rounds, r].sort((a, b) => a - b),
    });
  }

  function addSpan() {
    const from: QuestionRef = { round: fromRound, number: fromNumber };
    const to: QuestionRef = { round: toRound, number: toNumber };
    onchange({ ...range, spans: [...range.spans, { from, to }] });
  }

  function removeSpan(i: number) {
    onchange({ ...range, spans: range.spans.filter((_, j) => j !== i) });
  }

  const spanCount = (s: RangeSpec["spans"][number]) =>
    resolveRange(questions, { spans: [s], rounds: [] }).length;
  const select =
    "min-h-11 rounded-lg border border-stone-300 bg-white px-2 text-base";
</script>

<div class="space-y-5">
  <fieldset>
    <legend class="mb-2 font-bold">回を選ぶ</legend>
    <div class="flex flex-wrap gap-2">
      {#each rounds as r (r)}
        {@const on = range.rounds.includes(r)}
        <button
          type="button"
          class="min-h-11 rounded-lg border px-3 {on
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-300 bg-white'}"
          aria-pressed={on}
          onclick={() => toggleRound(r)}
        >
          第{r}回 <span class="text-sm opacity-70">({countIn(r)}問)</span>
        </button>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend class="mb-2 font-bold">始まりと終わりを指定</legend>
    <div class="flex flex-wrap items-center gap-2">
      <select class={select} bind:value={fromRound} aria-label="始まりの回">
        {#each rounds as r (r)}<option value={r}>第{r}回</option>{/each}
      </select>
      <select class={select} bind:value={fromNumber} aria-label="始まりの番号">
        {#each numbersOf(fromRound) as n (n)}<option value={n}>{n}番</option
          >{/each}
      </select>
      <span>〜</span>
      <select class={select} bind:value={toRound} aria-label="終わりの回">
        {#each rounds as r (r)}<option value={r}>第{r}回</option>{/each}
      </select>
      <select class={select} bind:value={toNumber} aria-label="終わりの番号">
        {#each numbersOf(toRound) as n (n)}<option value={n}>{n}番</option
          >{/each}
      </select>
      <button type="button" class={btn.small} onclick={addSpan}
        >範囲を足す</button
      >
    </div>
    {#if range.spans.length}
      <ul class="mt-3 space-y-2">
        {#each range.spans as s, i (i)}
          <li class="flex items-center gap-3">
            <span
              >第{s.from.round}回{s.from.number}番〜第{s.to.round}回{s.to
                .number}番（{spanCount(s)}問）</span
            >
            <button
              type="button"
              class="{btn.small} text-sm"
              onclick={() => removeSpan(i)}>外す</button
            >
          </li>
        {/each}
      </ul>
    {/if}
  </fieldset>
</div>
