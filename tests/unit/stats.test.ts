import { describe, expect, it } from "vitest";
import {
  overallStats,
  sortQuestionStats,
  statsByQuestion,
  statsByRound,
  weakQuestions,
} from "../../src/domain/stats";
import { att, loadFixtureQuestions } from "./helpers";

const qs = loadFixtureQuestions();

describe("統計", () => {
  const a = [
    att("49-1", true, 1),
    att("49-2", false, 1),
    att("50-1", false, 1),
    att("49-1", false, 2),
    att("49-2", false, 2),
    att("50-1", true, 2),
    att("99-1", true, 2),
  ];

  it("漢字ごと: 出題回数、正答回数、正答率、履歴", () => {
    const s = statsByQuestion(a, qs);
    expect(s.map((x) => x.questionId)).toEqual([
      "49-1",
      "49-2",
      "50-1",
      "99-1",
    ]);
    expect(s[0]).toMatchObject({
      total: 2,
      correct: 1,
      wrong: 1,
      rate: 0.5,
      history: [true, false],
    });
    expect(s[3]?.question).toBeUndefined(); // 削除された問題
  });

  it("回ごと", () => {
    expect(statsByRound(a)).toEqual([
      { round: 49, total: 4, correct: 1, rate: 0.25 },
      { round: 50, total: 2, correct: 1, rate: 0.5 },
      { round: 99, total: 1, correct: 1, rate: 1 },
    ]);
  });

  it("全体と直近の回", () => {
    const o = overallStats(a);
    expect(o.total).toBe(7);
    expect(o.correct).toBe(3);
    expect(o.lastSession).toMatchObject({
      sessionId: "s2",
      total: 4,
      correct: 2,
    });
    expect(overallStats([]).lastSession).toBeNull();
  });

  it("苦手な漢字: 2回以上、正答率の低い順、同率なら間違いの多い順", () => {
    const b = [
      ...a,
      att("49-5", false, 3),
      att("49-10", false, 3),
      att("49-10", true, 4),
      att("49-10", false, 5),
      att("49-10", true, 6),
    ];
    const weak = weakQuestions(statsByQuestion(b, qs), 2).map(
      (x) => x.questionId,
    );
    // 49-2: 0/2, 49-10: 2/4（間違い2）, 49-1: 1/2（間違い1）, 50-1: 1/2（間違い1）。49-5 は1回なので除く
    expect(weak).toEqual(["49-2", "49-10", "49-1", "50-1"]);
  });

  it("漢字ごとの並べ替え: 正答率・回数、同じ値は問題の順、逆順も", () => {
    const s = statsByQuestion(a, qs);
    const ids = (
      k: Parameters<typeof sortQuestionStats>[1],
      d: "asc" | "desc",
    ) => sortQuestionStats(s, k, d).map((x) => x.questionId);
    expect(ids("order", "asc")).toEqual(["49-1", "49-2", "50-1", "99-1"]);
    expect(ids("order", "desc")).toEqual(["99-1", "50-1", "49-2", "49-1"]);
    expect(ids("rate", "asc")).toEqual(["49-2", "49-1", "50-1", "99-1"]);
    expect(ids("rate", "desc")).toEqual(["99-1", "49-1", "50-1", "49-2"]);
    expect(ids("wrong", "desc")).toEqual(["49-2", "49-1", "50-1", "99-1"]);
    expect(ids("total", "asc")).toEqual(["99-1", "49-1", "49-2", "50-1"]);
    expect(s.map((x) => x.questionId)).toEqual(ids("order", "asc")); // 元は変えない
  });
});
