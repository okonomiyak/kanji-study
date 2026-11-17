<script lang="ts">
  import { untrack } from "svelte";
  import { ALL_QUESTIONS } from "../domain/picker";

  /** 問題数（5 / 10 / 20 / 30 / すべて / 自由。仕様書 2章）。value の 0 は「すべて」 */
  let {
    value,
    max,
    onchange,
  }: { value: number; max: number; onchange: (n: number) => void } = $props();

  const presets = ["5", "10", "20", "30"] as const;
  type Mode = (typeof presets)[number] | "all" | "custom";
  const options: [Mode, string][] = [
    ...presets.map((p): [Mode, string] => [p, `${p}問`]),
    ["all", "すべて"],
    ["custom", "自由に決める"],
  ];

  // 初期値だけを使う（以後はこの部品の中で持つ）
  const initial = untrack(() => value);
  let mode = $state<Mode>(
    initial === ALL_QUESTIONS
      ? "all"
      : (presets.find((p) => Number(p) === initial) ?? "custom"),
  );
  let custom = $state(initial === ALL_QUESTIONS ? 10 : initial);

  $effect(() => {
    onchange(
      mode === "all"
        ? ALL_QUESTIONS
        : mode === "custom"
          ? Math.max(1, Math.floor(custom || 1))
          : Number(mode),
    );
  });
</script>

<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
  {#each options as [v, label] (v)}
    <label class="flex min-h-11 items-center gap-2">
      <input type="radio" value={v} bind:group={mode} class="size-5" />
      {label}{#if v === "all" && max > 0}<span class="text-sm text-stone-500"
          >（{max}問）</span
        >{/if}
    </label>
  {/each}
  {#if mode === "custom"}
    <label class="flex items-center gap-2">
      <input
        type="number"
        min="1"
        bind:value={custom}
        class="min-h-11 w-24 rounded-lg border border-stone-300 px-2 text-lg"
        aria-label="問題数"
      />問
    </label>
  {/if}
</div>
{#if max > 0 && value !== ALL_QUESTIONS && value > max}
  <p class="mt-2 text-sm text-amber-700">
    対象が {max} 問なので、{max} 問（全部）を出します。
  </p>
{/if}
