import { describe, expect, it } from "vitest";
import {
  blankIndices,
  canConfirm,
  confirm,
  finish,
  goTo,
  grade,
  startQuiz,
  wrongQuestionIds,
} from "../../src/domain/quiz-session";

const start = () =>
  startQuiz({
    sessionId: "s1",
    mode: "normal",
    startedAt: "2026-11-17T20:00:00+09:00",
    questionIds: ["49-1", "49-2", "50-1"],
  });

describe("出題の状態遷移", () => {
  it("前へ・次へは範囲内に収まる", () => {
    let s = start();
    s = goTo(s, 5);
    expect(s.index).toBe(2);
    s = goTo(s, -1);
    expect(s.index).toBe(0);
  });

  it("未記入の問題の位置", () => {
    expect(blankIndices([true, false, true, false])).toEqual([1, 3]);
  });

  it("全問に○×が付くまで確定できない", () => {
    let s = finish(start());
    expect(s.phase).toBe("grading");
    s = grade(s, 0, true);
    s = grade(s, 1, false);
    expect(canConfirm(s)).toBe(false);
    expect(confirm(s, "t", () => "x")).toBeNull();
    s = grade(s, 2, true);
    s = grade(s, 2, false); // 付け直し
    expect(canConfirm(s)).toBe(true);
    let n = 0;
    const r = confirm(s, "2026-11-17T20:10:00+09:00", () => `id${n++}`);
    expect(r?.state.phase).toBe("confirmed");
    expect(r?.attempts.map((a) => [a.questionId, a.correct])).toEqual([
      ["49-1", true],
      ["49-2", false],
      ["50-1", false],
    ]);
    expect(r?.session).toMatchObject({
      id: "s1",
      count: 3,
      mode: "normal",
      finishedAt: "2026-11-17T20:10:00+09:00",
    });
    expect(wrongQuestionIds(s)).toEqual(["49-2", "50-1"]);
  });

  it("解答中は採点できない", () => {
    expect(grade(start(), 0, true).grades[0]).toBeNull();
  });

  it("問題なしでは始められない", () => {
    expect(() =>
      startQuiz({
        sessionId: "s",
        mode: "normal",
        startedAt: "t",
        questionIds: [],
      }),
    ).toThrow();
  });
});
