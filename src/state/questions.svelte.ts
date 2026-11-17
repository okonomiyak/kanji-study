import { parseQuestions } from "../domain/questions";
import type { Question, QuestionId } from "../domain/types";

/** 問題データの取得と保持（設計計画書 4.2 state） */
class QuestionsState {
  status = $state<"idle" | "loading" | "ready" | "error">("idle");
  list = $state<Question[]>([]);
  errorMessage = $state("");
  byId = $derived(new Map(this.list.map((q) => [q.id, q])));

  async load() {
    if (this.status === "loading" || this.status === "ready") return;
    this.status = "loading";
    try {
      const res = await fetch("/data/questions.json", {
        credentials: "same-origin",
        cache: "no-cache",
      });
      if (res.status === 401) {
        location.href = `/login?next=${encodeURIComponent(location.pathname + location.hash)}`;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { questions, errors } = parseQuestions(await res.json());
      if (errors.length) console.warn("問題データのエラー", errors);
      this.list = questions;
      this.status = "ready";
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : String(e);
      this.status = "error";
    }
  }

  get(id: QuestionId): Question | undefined {
    return this.byId.get(id);
  }
}

export const questions = new QuestionsState();
