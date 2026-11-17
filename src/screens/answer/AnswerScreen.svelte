<script lang="ts">
  import Dialog from "../../components/Dialog.svelte";
  import FuruText from "../../components/FuruText.svelte";
  import AnswerLayout from "../../components/layout/AnswerLayout.svelte";
  import { btn } from "../../components/buttons";
  import HandwritingCanvas from "../../handwriting/HandwritingCanvas.svelte";
  import {
    ERASER_WIDTH,
    PEN_WIDTHS,
    canUndo,
    clearAll,
    undo,
    type Tool,
  } from "../../handwriting/strokes";
  import { activeQuiz } from "../../state/active-quiz.svelte";
  import { questions } from "../../state/questions.svelte";
  import { router } from "../../state/router.svelte";
  import { settings } from "../../state/settings.svelte";
  import ToolBar from "./ToolBar.svelte";

  let tool = $state<Tool>("pen");
  let blankList = $state<number[]>([]);
  let confirmBlank = $state(false);
  let confirmQuit = $state(false);

  const quiz = $derived(activeQuiz.quiz);
  const index = $derived(quiz?.index ?? 0);
  const total = $derived(quiz?.questionIds.length ?? 0);
  const question = $derived(
    quiz ? questions.get(quiz.questionIds[index] ?? "") : undefined,
  );
  const ops = $derived(activeQuiz.inks[index] ?? []);
  const isLast = $derived(index === total - 1);

  $effect(() => {
    if (!quiz) router.go("home", true);
    else if (quiz.phase === "grading") router.go("grading", true);
    else if (quiz.phase === "confirmed") router.go("result", true);
  });

  async function toGrading(force = false) {
    const blanks = activeQuiz.blanks();
    if (blanks.length && !force) {
      blankList = blanks;
      confirmBlank = true;
      return;
    }
    confirmBlank = false;
    await activeQuiz.finish();
    router.go("grading");
  }

  function onKey(e: KeyboardEvent) {
    if (confirmBlank || confirmQuit) return;
    const t = e.target as HTMLElement | null;
    if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      activeQuiz.setInk(index, undo(ops));
    } else if (e.key === "ArrowRight") activeQuiz.goTo(index + 1);
    else if (e.key === "ArrowLeft") activeQuiz.goTo(index - 1);
    else if (e.key === "e") tool = tool === "pen" ? "eraser" : "pen";
  }
</script>

<svelte:window onkeydown={onKey} />

{#if quiz && question}
  <div
    class="flex h-dvh flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
  >
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <button class={btn.small} onclick={() => (confirmQuit = true)}
          >中断</button
        >
        <span class="text-lg font-bold" data-testid="progress"
          >{index + 1} / {total}</span
        >
        <span class="text-sm text-stone-500"
          >第{question.round}回 {question.number}番</span
        >
      </div>
      <ToolBar
        {tool}
        canUndo={canUndo(ops)}
        onTool={(t) => (tool = t)}
        onUndo={() => activeQuiz.setInk(index, undo(ops))}
        onClear={() => activeQuiz.setInk(index, clearAll(ops))}
      />
    </header>

    <AnswerLayout>
      {#snippet text()}
        <div class="rounded-2xl bg-white p-4 text-2xl md:text-3xl">
          <FuruText furu={question.furu} yomi={question.yomi} />
          <p class="mt-3 text-sm text-stone-500">
            太字の部分を漢字で書きましょう
          </p>
        </div>
      {/snippet}
      {#snippet canvas()}
        {#key index}
          <HandwritingCanvas
            {ops}
            {tool}
            width={tool === "pen"
              ? PEN_WIDTHS[settings.value.penWidth]
              : ERASER_WIDTH}
            penOnly={settings.value.penOnly}
            onchange={(o) => activeQuiz.setInk(index, o)}
            label="{index + 1}問目の手書き欄"
          />
        {/key}
      {/snippet}
    </AnswerLayout>

    <footer
      class="flex items-center justify-between gap-2 pb-[env(safe-area-inset-bottom)]"
    >
      <button
        class={btn.secondary}
        disabled={index === 0}
        onclick={() => activeQuiz.goTo(index - 1)}>前の問題</button
      >
      {#if isLast}
        <button class={btn.primary} onclick={() => toGrading()}
          >採点へ進む</button
        >
      {:else}
        <button class={btn.primary} onclick={() => activeQuiz.goTo(index + 1)}
          >次の問題</button
        >
      {/if}
    </footer>
  </div>
{/if}

<Dialog open={confirmBlank} title="書いていない問題があります">
  {blankList.map((i) => `${i + 1}問目`).join("、")} が未記入です。このまま採点に進みますか？
  {#snippet actions()}
    <button
      class={btn.secondary}
      onclick={() => {
        confirmBlank = false;
        activeQuiz.goTo(blankList[0] ?? 0);
      }}>戻って書く</button
    >
    <button class={btn.primary} onclick={() => toGrading(true)}
      >採点へ進む</button
    >
  {/snippet}
</Dialog>

<Dialog open={confirmQuit} title="中断しますか？">
  書いた内容は保存されているので、あとで続きから再開できます。破棄すると統計には記録されません。
  {#snippet actions()}
    <button class={btn.secondary} onclick={() => (confirmQuit = false)}
      >続ける</button
    >
    <button
      class={btn.danger}
      onclick={async () => {
        confirmQuit = false;
        await activeQuiz.discard();
        router.go("home");
      }}>破棄する</button
    >
    <button
      class={btn.primary}
      onclick={async () => {
        confirmQuit = false;
        await activeQuiz.suspend();
        router.go("home");
      }}>あとで再開</button
    >
  {/snippet}
</Dialog>
