<script lang="ts">
  import { untrack } from "svelte";
  /** 問題数（10 / 20 / 自由。仕様書 2章） */
  let {
    value,
    max,
    onchange,
  }: { value: number; max: number; onchange: (n: number) => void } = $props();

  // 初期値だけを使う（以後はこの部品の中で持つ）
  const initial = untrack(() => value);
  let mode = $state<"10" | "20" | "custom">(
    initial === 10 ? "10" : initial === 20 ? "20" : "custom",
  );
  let custom = $state(initial);

  $effect(() => {
    onchange(
      mode === "custom" ? Math.max(1, Math.floor(custom || 1)) : Number(mode),
    );
  });
</script>

<div class="flex flex-wrap items-center gap-4">
  {#each [["10", "10問"], ["20", "20問"], ["custom", "自由に決める"]] as [v, label] (v)}
    <label class="flex min-h-11 items-center gap-2">
      <input type="radio" value={v} bind:group={mode} class="size-5" />
      {label}
    </label>
  {/each}
  {#if mode === "custom"}
    <label class="flex items-center gap-2">
      <input
        type="number"
        min="1"
        max={max || 1}
        bind:value={custom}
        class="min-h-11 w-24 rounded-lg border border-stone-300 px-2 text-lg"
        aria-label="問題数"
      />問
    </label>
  {/if}
</div>
{#if max > 0 && value > max}
  <p class="mt-2 text-sm text-amber-700">
    対象が {max} 問なので、{max} 問にします。
  </p>
{/if}
