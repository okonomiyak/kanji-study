<script lang="ts">
  import Dialog from "../../components/Dialog.svelte";
  import FuruText from "../../components/FuruText.svelte";
  import AnswerLayout from "../../components/layout/AnswerLayout.svelte";
  import { btn } from "../../components/buttons";
  import { shouldIgnoreKey } from "../../components/keys";
  import HandwritingCanvas from "../../handwriting/HandwritingCanvas.svelte";
  import {
    ERASER_WIDTH,
    PEN_WIDTHS,
    canUndo,
    clearAll,
    redoStep,
    undoStep,
    type Op,
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
  // 問題ごとの「やり直し」の列（画面を離れたら消える）
  let redoStacks = $state.raw<Record<number, Op[]>>({});
  const redo = $derived(redoStacks[index] ?? []);

  function setInk(next: Op[], nextRedo: Op[] = []) {
    activeQuiz.setInk(index, next);
    redoStacks = { ...redoStacks, [index]: nextRedo };
  }
  function undoInk() {
    const h = undoStep(ops, redo);
    setInk(h.ops, h.redo);
  }
  function redoInk() {
    const h = redoStep(ops, redo);
    setInk(h.ops, h.redo);
  }
  const isLast = $derived(index === total - 1);

  $effect(() => {
    // 回の状態と合わない画面に来たら、合う画面へ移す
    if (activeQuiz.route !== "answer") router.go(activeQuiz.route, true);
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
    if (shouldIgnoreKey(e, { allowModifiers: true })) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "y" || (k === "z" && e.shiftKey))) {
      e.preventDefault();
      redoInk();
    } else if ((e.ctrlKey || e.metaKey) && k === "z") {
      e.preventDefault();
      undoInk();
    } else if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    } else if (e.key === "ArrowRight") activeQuiz.goTo(index + 1);
    else if (e.key === "ArrowLeft") activeQuiz.goTo(index - 1);
    else if (e.key === "e") tool = tool === "pen" ? "eraser" : "pen";
  }
</script>

<svelte:window onkeydown={onKey} />

{#if quiz && question}
  <AnswerLayout>
    {#snippet header()}
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
    {/snippet}
    {#snippet tools()}
      <ToolBar
        {tool}
        canUndo={canUndo(ops)}
        canRedo={redo.length > 0}
        onTool={(t) => (tool = t)}
        onUndo={undoInk}
        onRedo={redoInk}
        onClear={() => setInk(clearAll(ops))}
      />
    {/snippet}
    {#snippet text()}
      <div class="flex h-full flex-col gap-2 rounded-2xl bg-white p-4">
        <FuruText
          furu={question.furu}
          yomi={question.yomi}
          vertical
          class="min-h-0 flex-1 text-2xl md:text-3xl [@media(max-height:500px)]:text-lg"
        />
        <p class="text-sm text-stone-500">太字の部分を漢字で書きましょう</p>
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
          onchange={(o) => setInk(o)}
          label="{index + 1}問目の手書き欄"
        />
      {/key}
    {/snippet}
    {#snippet nav()}
      <div class="flex items-center justify-between gap-2">
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
      </div>
    {/snippet}
  </AnswerLayout>
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
