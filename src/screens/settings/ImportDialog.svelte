<script lang="ts">
  import Dialog from "../../components/Dialog.svelte";
  import { btn } from "../../components/buttons";
  import {
    parseBackup,
    planMerge,
    type MergePlan,
    type ParseBackupError,
  } from "../../domain/backup";
  import { history } from "../../state/history.svelte";

  /** JSONの読み込み（統合）。追加される件数と重複件数を見せてから反映する（仕様書 7.4） */
  let {
    open,
    onclose,
    ondone,
  }: { open: boolean; onclose: () => void; ondone: (msg: string) => void } =
    $props();

  let plan = $state.raw<MergePlan | null>(null);
  let error = $state("");
  let busy = $state(false);
  let input: HTMLInputElement | undefined = $state();

  const messages: Record<ParseBackupError, string> = {
    "not-json": "JSONファイルとして読めませんでした。",
    format: "このアプリのバックアップファイルではありません。",
    newer:
      "新しい版のアプリで書き出されたファイルです。アプリを更新してください（再読み込み）。",
    invalid: "ファイルの中身が壊れています。",
  };

  async function onFile(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    plan = null;
    error = "";
    if (!file) return;
    const r = parseBackup(await file.text());
    if (!r.ok) {
      error = messages[r.error];
      return;
    }
    plan = planMerge(
      { sessions: history.sessions, attempts: history.attempts },
      r.data,
    );
  }

  async function apply() {
    if (!plan) return;
    busy = true;
    try {
      await history.merge(plan);
      ondone(`${plan.newAttempts.length} 件の解答記録を追加しました。`);
      reset();
    } catch (e) {
      error = `保存できませんでした: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      busy = false;
    }
  }

  function reset() {
    plan = null;
    error = "";
    if (input) input.value = "";
    onclose();
  }
</script>

<Dialog {open} title="JSONを読み込む（統合）">
  <p class="mb-3 text-sm">
    今の記録に足し合わせます。上書きはしません。同じファイルを2回読み込んでも増えません。
  </p>
  <input
    bind:this={input}
    type="file"
    accept="application/json,.json"
    onchange={onFile}
    aria-label="バックアップファイル"
    class="block w-full text-sm"
  />
  {#if error}<p class="mt-3 text-red-700" role="alert">{error}</p>{/if}
  {#if plan}
    <div class="mt-3 rounded-xl bg-stone-50 p-3" data-testid="import-plan">
      <p>追加される解答記録: <strong>{plan.newAttempts.length}</strong> 件</p>
      <p>重複していた解答記録: {plan.duplicatedAttempts} 件</p>
      <p class="text-sm text-stone-500">
        回の記録: 追加 {plan.newSessions.length} 件 ／ 重複 {plan.duplicatedSessions}
        件
      </p>
    </div>
  {/if}
  {#snippet actions()}
    <button class={btn.secondary} onclick={reset}>やめる</button>
    <button
      class={btn.primary}
      disabled={!plan ||
        busy ||
        plan.newAttempts.length + plan.newSessions.length === 0}
      onclick={apply}
    >
      統合する
    </button>
  {/snippet}
</Dialog>
