import {
  blankIndices,
  canConfirm,
  confirm,
  finish,
  goTo,
  grade,
  startQuiz,
  type QuizState,
} from "../domain/quiz-session";
import { toLocalIso } from "../domain/time";
import type { Mode, QuestionId, RangeSpec } from "../domain/types";
import { compactOps, hasInk, type Op } from "../handwriting/strokes";
import {
  deleteDraft,
  loadDraft,
  saveDraft,
  type Draft,
} from "../storage/drafts-repo";
import { history } from "./history.svelte";

const SAVE_DELAY_MS = 500;

const newId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** 今の出題の状態と、手書きの自動保存（設計計画書 4.2 state） */
class ActiveQuiz {
  quiz = $state.raw<QuizState | null>(null);
  inks = $state.raw<Op[][]>([]);
  /** 起動時に見つかった未完了の回（再開 / 破棄を聞く） */
  pending = $state.raw<Draft | null>(null);
  saving = $state(false);
  saveError = $state("");

  #timer: ReturnType<typeof setTimeout> | null = null;

  hasInkAt = (i: number) => hasInk(this.inks[i] ?? []);

  async checkPending() {
    this.pending = await loadDraft();
  }

  resumePending() {
    if (!this.pending) return;
    this.quiz = this.pending.quiz;
    this.inks = this.pending.inks;
    this.pending = null;
  }

  /** 中断して、あとで再開できるようにする */
  async suspend() {
    if (!this.quiz) return;
    await this.saveNow();
    this.pending = {
      quiz: this.quiz,
      inks: this.inks,
      savedAt: toLocalIso(new Date()),
    };
    this.quiz = null;
    this.inks = [];
  }

  async discardPending() {
    this.pending = null;
    await deleteDraft();
  }

  async start(questionIds: QuestionId[], mode: Mode, range?: RangeSpec) {
    this.quiz = startQuiz({
      sessionId: newId(),
      mode,
      startedAt: toLocalIso(new Date()),
      questionIds,
      ...(range ? { range } : {}),
    });
    this.inks = questionIds.map(() => []);
    await this.saveNow();
  }

  setInk(index: number, ops: Op[]) {
    const inks = [...this.inks];
    inks[index] = ops;
    this.inks = inks;
    this.scheduleSave();
  }

  goTo(index: number) {
    if (!this.quiz) return;
    this.quiz = goTo(this.quiz, index);
    this.scheduleSave();
  }

  blanks(): number[] {
    return blankIndices(this.inks.map((ops) => hasInk(ops)));
  }

  async finish() {
    if (!this.quiz) return;
    this.quiz = finish(this.quiz);
    await this.saveNow();
  }

  grade(index: number, correct: boolean) {
    if (!this.quiz) return;
    this.quiz = grade(this.quiz, index, correct);
    this.scheduleSave();
  }

  get canConfirm() {
    return this.quiz ? canConfirm(this.quiz) : false;
  }

  /** 採点を確定する。記録を足し、手書きを消す（1つのトランザクション） */
  async confirm(): Promise<boolean> {
    if (!this.quiz) return false;
    const r = confirm(this.quiz, toLocalIso(new Date()), newId);
    if (!r) return false;
    this.cancelTimer();
    await history.commit(r.session, r.attempts);
    this.quiz = r.state;
    this.inks = [];
    return true;
  }

  /** 回を破棄する（統計に記録しない） */
  async discard() {
    this.cancelTimer();
    this.quiz = null;
    this.inks = [];
    await deleteDraft();
  }

  private cancelTimer() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
  }

  private scheduleSave() {
    this.cancelTimer();
    this.#timer = setTimeout(() => void this.saveNow(), SAVE_DELAY_MS);
  }

  async saveNow() {
    this.cancelTimer();
    if (!this.quiz || this.quiz.phase === "confirmed") return;
    this.saving = true;
    try {
      await saveDraft({
        quiz: this.quiz,
        inks: this.inks.map((ops) => compactOps(ops)),
        savedAt: toLocalIso(new Date()),
      });
      this.saveError = "";
    } catch (e) {
      this.saveError = e instanceof Error ? e.message : String(e);
    } finally {
      this.saving = false;
    }
  }
}

export const activeQuiz = new ActiveQuiz();

// タブを閉じる・隠すときに保存しておく
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void activeQuiz.saveNow();
  });
}
