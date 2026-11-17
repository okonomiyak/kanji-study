<script lang="ts">
  import { onMount } from "svelte";
  import { btn } from "../../components/buttons";
  import { PEN_WIDTHS, type PenWidth } from "../../handwriting/strokes";
  import { getLastExportAt } from "../../storage/meta";
  import { requestPersist, type PersistState } from "../../storage/persist";
  import { exportBackup } from "../../state/export";
  import { history } from "../../state/history.svelte";
  import { settings } from "../../state/settings.svelte";
  import ClearDialog from "./ClearDialog.svelte";
  import ImportDialog from "./ImportDialog.svelte";

  const widthLabels: Record<PenWidth, string> = {
    thin: "細い",
    normal: "ふつう",
    thick: "太い",
  };
  let message = $state("");
  let importOpen = $state(false);
  let clearOpen = $state(false);
  let persist = $state<PersistState | null>(null);
  let lastExport = $state(getLastExportAt());

  const persistLabels: Record<PersistState, string> = {
    persisted: "許可されています（ブラウザが自動で消すことはありません）",
    "not-persisted":
      "許可されていません。ホーム画面に追加して使うと消えにくくなります",
    unsupported: "このブラウザでは確認できません",
  };

  onMount(async () => {
    persist = await requestPersist();
  });

  async function doExport() {
    const r = await exportBackup();
    message = r === "cancelled" ? "" : "書き出しました。";
    lastExport = getLastExportAt();
  }
</script>

<div class="mx-auto max-w-2xl space-y-6 p-4 pb-16">
  <header class="flex items-center gap-3">
    <a href="#/" class="text-stone-500 underline">戻る</a>
    <h1 class="text-xl font-bold">設定・データ管理</h1>
  </header>

  {#if message}<p
      class="rounded-xl bg-emerald-50 p-3 text-emerald-800"
      role="status"
    >
      {message}
    </p>{/if}

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
    <p class="text-sm text-stone-600">
      解答記録 {history.attempts.length} 件 ／ 最後の書き出し: {lastExport
        ? lastExport.toLocaleString("ja-JP")
        : "まだ"}
    </p>
    <div class="flex flex-wrap gap-2">
      <button class={btn.secondary} onclick={doExport}>JSONを書き出す</button>
      <button class={btn.secondary} onclick={() => (importOpen = true)}
        >JSONを読み込む（統合）</button
      >
    </div>
    <p class="text-sm text-stone-600" data-testid="persist">
      データの保護: {persist ? persistLabels[persist] : "確認中…"}
    </p>
  </section>

  <section class="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
    <h2 class="font-bold text-red-800">統計データをクリア</h2>
    <button class={btn.danger} onclick={() => (clearOpen = true)}
      >統計データをクリア…</button
    >
  </section>

  <section class="text-sm">
    <a href="/logout" class="text-stone-500 underline">ログアウト</a>
  </section>
</div>

<ImportDialog
  open={importOpen}
  onclose={() => (importOpen = false)}
  ondone={(m) => (message = m)}
/>
<ClearDialog
  open={clearOpen}
  onclose={() => (clearOpen = false)}
  ondone={(m) => (message = m)}
/>
