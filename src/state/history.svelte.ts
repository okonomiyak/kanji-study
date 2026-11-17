import { DEFAULT_CONFIG } from "../domain/config";
import { computeReview, reviewBreakdown } from "../domain/review";
import type { Attempt, Session } from "../domain/types";
import { commitSession, loadHistory } from "../storage/attempts-repo";

/** 解答記録の保持と、復習の派生値（設計計画書 4.2 state） */
class HistoryState {
  loaded = $state(false);
  attempts = $state.raw<Attempt[]>([]);
  sessions = $state.raw<Session[]>([]);
  review = $derived(
    computeReview(this.attempts, DEFAULT_CONFIG.graduateStreak),
  );
  breakdown = $derived(
    reviewBreakdown(this.review, DEFAULT_CONFIG.graduateStreak),
  );

  async load() {
    const h = await loadHistory();
    this.attempts = h.attempts;
    this.sessions = h.sessions;
    this.loaded = true;
  }

  /** 採点の確定を保存して反映する */
  async commit(session: Session, attempts: Attempt[]) {
    await commitSession(session, attempts);
    this.attempts = [...this.attempts, ...attempts];
    this.sessions = [...this.sessions, session];
  }
}

export const history = new HistoryState();
