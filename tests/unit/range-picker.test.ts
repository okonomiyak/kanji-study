import { describe, expect, it } from "vitest";
import {
  describeRange,
  resolveRange,
  sanitizeRange,
} from "../../src/domain/range";
import {
  ALL_QUESTIONS,
  pickPrioritized,
  pickRandom,
  priorityIds,
  pickReview,
  resolveCount,
} from "../../src/domain/picker";
import { seededRng } from "../../src/domain/random";
import { loadFixtureQuestions, loadRealQuestions } from "./helpers";

const qs = loadFixtureQuestions();

describe("出題範囲", () => {
  it("始まり〜終わり（間の回をすべて含む）", () => {
    expect(
      resolveRange(qs, {
        spans: [
          { from: { round: 49, number: 5 }, to: { round: 50, number: 2 } },
        ],
        rounds: [],
      }),
    ).toEqual(["49-5", "49-10", "50-1", "50-2"]);
  });

  it("回を選ぶ（飛び飛び）", () => {
    expect(resolveRange(qs, { spans: [], rounds: [49, 52] })).toEqual([
      "49-1",
      "49-2",
      "49-5",
      "49-10",
      "52-1",
    ]);
  });

  it("足し合わせても重複しない、逆順の指定も受け付ける", () => {
    const ids = resolveRange(qs, {
      spans: [
        { from: { round: 50, number: 1 }, to: { round: 49, number: 10 } },
      ],
      rounds: [50],
    });
    expect(ids).toEqual(["49-10", "50-1", "50-2", "50-3"]);
  });

  it("本物のデータ: 第49回5番〜第51回10番", () => {
    const real = loadRealQuestions().questions;
    const ids = resolveRange(real, {
      spans: [
        { from: { round: 49, number: 5 }, to: { round: 51, number: 10 } },
      ],
      rounds: [],
    });
    expect(ids[0]).toBe("49-5");
    expect(ids[ids.length - 1]).toBe("51-10");
    expect(ids).toContain("50-1");
  });

  it("説明と検査", () => {
    expect(
      describeRange({
        spans: [
          { from: { round: 49, number: 5 }, to: { round: 50, number: 3 } },
        ],
        rounds: [53],
      }),
    ).toBe("第49回5番〜第50回3番、第53回");
    expect(
      sanitizeRange({
        spans: [
          { from: { round: 1, number: 2 }, to: { round: 3, number: 4 } },
          { bad: 1 },
        ],
        rounds: [1, "x"],
      }),
    ).toEqual({
      spans: [{ from: { round: 1, number: 2 }, to: { round: 3, number: 4 } }],
      rounds: [1],
    });
    expect(sanitizeRange("x")).toBeNull();
  });
});

describe("ランダム選択", () => {
  const ids = qs.map((q) => q.id);
  it("同じ種なら同じ結果", () => {
    expect(pickRandom(ids, 5, seededRng(1))).toEqual(
      pickRandom(ids, 5, seededRng(1)),
    );
  });
  it("問題数が範囲を超えたら範囲の数まで、重複なし", () => {
    const picked = pickRandom(ids, 100, seededRng(2));
    expect(picked).toHaveLength(ids.length);
    expect(new Set(picked).size).toBe(ids.length);
    expect([...picked].sort()).toEqual([...ids].sort());
  });
  it("復習は連続正解の少ないもの、次に間違いの多いものを優先", () => {
    const entries = [
      { questionId: "a", streak: 2, wrongCount: 5 },
      { questionId: "b", streak: 0, wrongCount: 1 },
      { questionId: "c", streak: 1, wrongCount: 1 },
      { questionId: "d", streak: 0, wrongCount: 3 },
    ];
    for (let seed = 0; seed < 20; seed++) {
      expect(pickReview(entries, 2, seededRng(seed)).sort()).toEqual([
        "b",
        "d",
      ]);
      expect(pickReview(entries, 3, seededRng(seed)).sort()).toEqual([
        "b",
        "c",
        "d",
      ]);
    }
    expect(pickReview(entries, 1, seededRng(0))).toEqual(["d"]);
  });
});

describe("問題数", () => {
  it("すべて・多すぎる指定・ふつうの指定", () => {
    expect(resolveCount(ALL_QUESTIONS, 42)).toBe(42);
    expect(resolveCount(100, 42)).toBe(42);
    expect(resolveCount(10, 42)).toBe(10);
    expect(resolveCount(10, 0)).toBe(0);
  });
});

describe("間違えた問題・まだ解いていない問題を優先", () => {
  const ids = Array.from({ length: 20 }, (_, i) => `49-${i + 1}`);
  const review = new Set(["49-3", "49-7"]);
  const answered = new Set(ids.slice(0, 15)); // 49-16〜49-20 は未回答

  it("優先する問題を分ける", () => {
    expect(priorityIds(ids, review, answered)).toEqual({
      wrong: ["49-3", "49-7"],
      unanswered: ["49-16", "49-17", "49-18", "49-19", "49-20"],
    });
  });

  it("優先する問題から先に選び、足りない分を残りから選ぶ", () => {
    const { wrong, unanswered } = priorityIds(ids, review, answered);
    const priority = new Set([...wrong, ...unanswered]);
    for (let seed = 1; seed <= 20; seed++) {
      const five = pickPrioritized(ids, 5, priority, seededRng(seed));
      expect(five).toHaveLength(5);
      expect(five.every((id) => priority.has(id))).toBe(true);
      const ten = pickPrioritized(ids, 10, priority, seededRng(seed));
      expect(new Set(ten).size).toBe(10);
      expect([...priority].every((id) => ten.includes(id))).toBe(true);
    }
    expect(pickPrioritized(ids, 100, priority, seededRng(1))).toHaveLength(20);
  });
});
