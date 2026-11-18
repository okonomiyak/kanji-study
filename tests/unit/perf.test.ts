import { describe, expect, it } from "vitest";
import { computeReview } from "../../src/domain/review";
import {
  overallStats,
  statsByQuestion,
  statsByRound,
  weakQuestions,
} from "../../src/domain/stats";
import type { Attempt } from "../../src/domain/types";
import { seededRng } from "../../src/domain/random";
import { loadSampleQuestions } from "./helpers";

describe("計算の速さ（計画書 フェーズ5: 解答記録1万件）", () => {
  it("復習と統計を合わせて 200ms 以内", () => {
    const qs = loadSampleQuestions().questions;
    const rng = seededRng(42);
    const attempts: Attempt[] = Array.from({ length: 10_000 }, (_, i) => ({
      id: `a${i}`,
      questionId: qs[Math.floor(rng() * qs.length)]!.id,
      sessionId: `s${Math.floor(i / 10)}`,
      mode: "normal",
      correct: rng() > 0.3,
      answeredAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
    }));
    const t0 = performance.now();
    computeReview(attempts, 3);
    const byQ = statsByQuestion(attempts, qs);
    statsByRound(attempts);
    overallStats(attempts);
    weakQuestions(byQ, 2);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(200);
  });
});
