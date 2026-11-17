import { describe, expect, it } from "vitest";
import { computeReview, reviewBreakdown } from "../../src/domain/review";
import { att } from "./helpers";

const G = 3;
const streakOf = (attempts: ReturnType<typeof att>[], id = "49-1") =>
  computeReview(attempts, G).get(id)?.streak;

describe("復習のルール（仕様書 6.1）", () => {
  it("1. × が付くと復習リストに入る（連続正解 0）", () => {
    expect(streakOf([att("49-1", false, 1)])).toBe(0);
  });

  it("○ だけの問題はリストに入らない", () => {
    expect(computeReview([att("49-1", true, 1)], G).size).toBe(0);
  });

  it("2. リストの問題に ○ で連続正解が増える", () => {
    expect(streakOf([att("49-1", false, 1), att("49-1", true, 2)])).toBe(1);
  });

  it("3. 連続正解 3 で卒業", () => {
    const list = computeReview(
      [
        att("49-1", false, 1),
        att("49-1", true, 2),
        att("49-1", true, 3),
        att("49-1", true, 4),
      ],
      G,
    );
    expect(list.has("49-1")).toBe(false);
  });

  it("4. 途中の × で 0 に戻る", () => {
    expect(
      streakOf([
        att("49-1", false, 1),
        att("49-1", true, 2),
        att("49-1", true, 3),
        att("49-1", false, 4),
      ]),
    ).toBe(0);
  });

  it("6. 卒業後に × で再び 0 から入る", () => {
    const a = [
      att("49-1", false, 1),
      att("49-1", true, 2),
      att("49-1", true, 3),
      att("49-1", true, 4),
      att("49-1", false, 5),
    ];
    expect(computeReview(a, G).get("49-1")).toEqual({
      questionId: "49-1",
      streak: 0,
      wrongCount: 2,
    });
  });

  it("7. 日付は使わない（同じ夜のうちに卒業できる）、並び順は時刻で決まる", () => {
    const a = [
      att("49-1", false, 1),
      att("49-1", true, 2),
      att("49-1", true, 3),
      att("49-1", true, 4),
    ];
    expect(computeReview([...a].reverse(), G).has("49-1")).toBe(false);
  });

  it("卒業の回数は設定で変えられる", () => {
    const a = [att("49-1", false, 1), att("49-1", true, 2)];
    expect(computeReview(a, 1).size).toBe(0);
  });

  it("内訳（連続正解 0/1/2）", () => {
    const a = [
      att("1-1", false, 1),
      att("1-2", false, 1),
      att("1-3", false, 1),
      att("1-3", true, 2),
      att("1-2", true, 2),
      att("1-2", true, 3),
    ];
    expect(reviewBreakdown(computeReview(a, G), G)).toEqual([1, 1, 1]);
  });
});
