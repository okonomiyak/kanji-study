<script lang="ts">
  import { btn } from "../../components/buttons";
  import { PEN_WIDTHS, type PenWidth } from "../../handwriting/strokes";
  import { exportBackup } from "../../state/export";
  import { settings } from "../../state/settings.svelte";

  const widthLabels: Record<PenWidth, string> = {
    thin: "細い",
    normal: "ふつう",
    thick: "太い",
  };
  let message = $state("");

  async function doExport() {
    const r = await exportBackup();
    message = r === "cancelled" ? "" : "書き出しました。";
  }
</script>

<div class="mx-auto max-w-2xl space-y-6 p-4">
  <header class="flex items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-xl font-bold">設定・データ管理</h1>
  </header>

  <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
    <h2 class="font-bold">手書き</h2>
    <label class="flex min-h-11 items-center gap-3">
      <input
        type="checkbox"
        class="size-5"
        checked={settings.value.penOnly}
        onchange={(e) => settings.update({ penOnly: e.currentTarget.checked })}
      />
      ペン入力のみ受け付ける（Apple Pencil。手のひらの誤タッチ防止）
    </label>
    <fieldset class="flex flex-wrap items-center gap-4">
      <legend class="mb-1">ペンの太さ</legend>
      {#each Object.keys(PEN_WIDTHS) as PenWidth[] as w (w)}
        <label class="flex min-h-11 items-center gap-2">
          <input
            type="radio"
            name="pen-width"
            class="size-5"
            checked={settings.value.penWidth === w}
            onchange={() => settings.update({ penWidth: w })}
          />
          {widthLabels[w]}
        </label>
      {/each}
    </fieldset>
    <a href="#/trial" class="text-stone-600 underline">試し書きする</a>
  </section>

  <section class="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
    <h2 class="font-bold">データ</h2>
    <button class={btn.secondary} onclick={doExport}>JSONを書き出す</button>
    {#if message}<p class="text-emerald-700" role="status">{message}</p>{/if}
  </section>

  <section class="text-sm">
    <a href="/logout" class="text-stone-500 underline">ログアウト</a>
  </section>
</div>
