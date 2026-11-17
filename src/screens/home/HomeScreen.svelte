<script lang="ts">
  import { btn } from "../../components/buttons";
  import { DEFAULT_CONFIG } from "../../domain/config";
  import { daysBetween } from "../../domain/time";
  import { getLastExportAt } from "../../storage/meta";
  import { exportBackup } from "../../state/export";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { history } from "../../state/history.svelte";
  import { router } from "../../state/router.svelte";

  let lastExport = $state(getLastExportAt());
  const days = $derived(
    lastExport ? daysBetween(lastExport, new Date()) : null,
  );
  const warn = $derived(
    history.attempts.length > 0 &&
      (days === null || days >= DEFAULT_CONFIG.backupWarningDays),
  );

  async function doExport() {
    await exportBackup();
    lastExport = getLastExportAt();
  }
</script>

<div
  class="mx-auto max-w-2xl space-y-6 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
>
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">漢字の書き取り</h1>
    <a href="#/settings" class="text-stone-600 underline">設定</a>
  </header>

  {#if warn}
    <div
      class="rounded-2xl border border-amber-300 bg-amber-50 p-4"
      role="status"
    >
      <p class="mb-2">
        {days === null
          ? "まだJSONを書き出していません。"
          : `最後の書き出しから ${days} 日たちました。`}
        記録が消えたときのために、バックアップを書き出しましょう。
      </p>
      <button class={btn.secondary} onclick={doExport}>JSONを書き出す</button>
    </div>
  {/if}

  {#if activeQuiz.pending}
    <div class="rounded-2xl border border-sky-300 bg-sky-50 p-4" role="status">
      <p class="mb-2">
        途中の回（{activeQuiz.pending.quiz.questionIds.length} 問）があります。
      </p>
      <div class="flex gap-2">
        <button
          class={btn.primary}
          onclick={() => {
            activeQuiz.resumePending();
            router.go(activeQuiz.quiz?.phase === "grading" ? "grading" : "answer");
          }}>続きから再開する</button
        >
        <button
          class={btn.secondary}
          onclick={() => activeQuiz.discardPending()}>破棄する</button
        >
      </div>
    </div>
  {/if}

  <div class="grid gap-3">
    <a href="#/setup" class="{btn.primary} min-h-16 text-xl">出題する</a>
  </div>

  <section class="rounded-2xl border border-stone-200 bg-white p-4">
    <h2 class="mb-2 font-bold">復習リスト</h2>
    <p>
      <span class="text-2xl font-bold" data-testid="review-count"
        >{history.review.size}</span
      >
      件
      <span class="ml-2 text-sm text-stone-500">
        （連続正解 {history.breakdown
          .map((n, i) => `${i}回: ${n}`)
          .join(" / ")}）
      </span>
    </p>
  </section>

  <section class="text-sm text-stone-600">
    <p>これまでの解答: {history.attempts.length} 問</p>
    {#if lastExport}<p>
        最後の書き出し: {lastExport.toLocaleString("ja-JP")}
      </p>{/if}
  </section>
</div>
