<script lang="ts">
  import { btn } from "../../components/buttons";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { questions } from "../../state/questions.svelte";
  import { router } from "../../state/router.svelte";
  import GradingCard from "./GradingCard.svelte";

  const quiz = $derived(activeQuiz.quiz);
  const index = $derived(quiz?.index ?? 0);
  const total = $derived(quiz?.questionIds.length ?? 0);
  const question = $derived(
    quiz ? questions.get(quiz.questionIds[index] ?? "") : undefined,
  );
  const current = $derived(quiz?.grades[index] ?? null);
  let saving = $state(false);
  let error = $state("");

  $effect(() => {
    if (!quiz) router.go("home", true);
    else if (quiz.phase === "answering") router.go("answer", true);
    else if (quiz.phase === "confirmed") router.go("result", true);
  });

  function mark(correct: boolean) {
    activeQuiz.grade(index, correct);
    // 未採点の次の問題へ進む
    const grades = activeQuiz.quiz?.grades ?? [];
    for (let k = 1; k <= total; k++) {
      const j = (index + k) % total;
      if (grades[j] === null) {
        activeQuiz.goTo(j);
        return;
      }
    }
  }

  async function confirmAll() {
    saving = true;
    error = "";
    try {
      if (await activeQuiz.confirm()) router.go("result");
    } catch (e) {
      error = `保存できませんでした: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      saving = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "o" || e.key === "1") mark(true);
    else if (e.key === "x" || e.key === "2") mark(false);
    else if (e.key === "ArrowRight") activeQuiz.goTo(index + 1);
    else if (e.key === "ArrowLeft") activeQuiz.goTo(index - 1);
  }
</script>

<svelte:window onkeydown={onKey} />

{#if quiz && question}
  <div
    class="flex h-dvh flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
  >
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold">自己採点</h1>
        <span class="text-lg" data-testid="progress">{index + 1} / {total}</span
        >
      </div>
      <nav class="flex flex-wrap gap-1" aria-label="問題の一覧">
        {#each quiz.grades as g, i (i)}
          <button
            class="size-9 rounded-full border text-sm {i === index
              ? 'ring-2 ring-stone-900'
              : ''} {g === true
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
              : g === false
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-stone-300 bg-white'}"
            aria-label="{i + 1}問目{g === true
              ? '（○）'
              : g === false
                ? '（×）'
                : ''}"
            onclick={() => activeQuiz.goTo(i)}
            >{g === true ? "○" : g === false ? "×" : i + 1}</button
          >
        {/each}
      </nav>
    </header>

    <GradingCard {question} ops={activeQuiz.inks[index] ?? []} />

    <footer
      class="flex flex-wrap items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]"
    >
      <button
        class={btn.small}
        disabled={index === 0}
        onclick={() => activeQuiz.goTo(index - 1)}>前へ</button
      >
      <div class="flex gap-3">
        <button
          class="min-h-14 min-w-24 rounded-2xl border-2 text-3xl font-bold {current ===
          true
            ? 'border-emerald-700 bg-emerald-600 text-white'
            : 'border-emerald-600 bg-white text-emerald-700'}"
          aria-pressed={current === true}
          aria-label="正解（○）"
          onclick={() => mark(true)}>○</button
        >
        <button
          class="min-h-14 min-w-24 rounded-2xl border-2 text-3xl font-bold {current ===
          false
            ? 'border-red-700 bg-red-600 text-white'
            : 'border-red-600 bg-white text-red-700'}"
          aria-pressed={current === false}
          aria-label="不正解（×）"
          onclick={() => mark(false)}>×</button
        >
      </div>
      <button
        class={btn.small}
        disabled={index === total - 1}
        onclick={() => activeQuiz.goTo(index + 1)}>次へ</button
      >
      <div class="flex w-full justify-end">
        <button
          class={btn.primary}
          disabled={!activeQuiz.canConfirm || saving}
          onclick={confirmAll}
        >
          採点を確定
        </button>
      </div>
      {#if error}<p class="w-full text-red-700" role="alert">{error}</p>{/if}
    </footer>
  </div>
{/if}
