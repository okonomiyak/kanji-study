<script lang="ts">
  import Dialog from "../../components/Dialog.svelte";
  import { btn } from "../../components/buttons";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { exportBackup } from "../../state/export";
  import { history } from "../../state/history.svelte";

  /** 統計データをクリア（仕様書 7.7）: 書き出しの案内 →「クリア」と入力 → 削除 */
  let {
    open,
    onclose,
    ondone,
  }: { open: boolean; onclose: () => void; ondone: (msg: string) => void } =
    $props();

  let typed = $state("");
  let busy = $state(false);
  let exported = $state(false);

  async function doExport() {
    exported = (await exportBackup()) !== "cancelled";
  }

  async function clear() {
    if (typed !== "クリア") return;
    busy = true;
    try {
      await history.clear();
      await activeQuiz.discard();
      ondone("統計データをクリアしました。");
      close();
    } finally {
      busy = false;
    }
  }

  function close() {
    typed = "";
    exported = false;
    onclose();
  }
</script>

<Dialog {open} title="統計データをクリア">
  <p class="mb-2">
    解答記録、回の記録、復習リスト、途中の回の手書きを消します。設定と問題データは残ります。
  </p>
  <p class="mb-3 font-bold text-red-700">
    元には戻せません（書き出したJSONを読み込めば戻せます）。
  </p>
  <div class="mb-3 flex items-center gap-3">
    <button class={btn.secondary} onclick={doExport}>先にJSONを書き出す</button>
    {#if exported}<span class="text-emerald-700">書き出しました</span>{/if}
  </div>
  <label class="block">
    確認のため「クリア」と入力してください
    <input
      bind:value={typed}
      class="mt-1 min-h-11 w-full rounded-lg border border-stone-300 px-3 text-lg"
      aria-label="確認の入力"
    />
  </label>
  {#snippet actions()}
    <button class={btn.secondary} onclick={close}>やめる</button>
    <button
      class={btn.danger}
      disabled={typed !== "クリア" || busy}
      onclick={clear}>クリアする</button
    >
  {/snippet}
</Dialog>
