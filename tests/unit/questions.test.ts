import { describe, expect, it } from "vitest";
import {
  listRounds,
  makeQuestionId,
  parseQuestionId,
  parseQuestions,
} from "../../src/domain/questions";
import { splitFuru } from "../../src/domain/furu";
import { loadSampleQuestions } from "./helpers";

describe("問題データ", () => {
  it("見本の129問が読み込め、IDが 49-1 形式になる", () => {
    const { questions, errors } = loadSampleQuestions();
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(129);
    expect(questions[0]?.id).toBe("49-1");
    expect(questions.every((q) => /^\d+-\d+$/.test(q.id))).toBe(true);
    expect(listRounds(questions)).toEqual([49, 50, 51, 52, 53, 54]);
  });

  it("番号は数値として並ぶ（10 は 2 の後）", () => {
    const { questions } = parseQuestions({
      "50": {
        "10": { kanji: "a", yomi: "ア", furu: "ア", imi: "x" },
        "2": { kanji: "b", yomi: "イ", furu: "イ", imi: "x" },
      },
      "9": { "1": { kanji: "c", yomi: "ウ", furu: "ウ", imi: "x" } },
    });
    expect(questions.map((q) => q.id)).toEqual(["9-1", "50-2", "50-10"]);
  });

  it("不正なデータをエラーにする", () => {
    const { questions, errors } = parseQuestions({
      "49": {
        "1": { kanji: "a", yomi: "ア", furu: "アア", imi: "x" },
        "2": { kanji: "a", yomi: "ア", furu: "イ", imi: "x" },
        "3": { kanji: "a", yomi: "ア", furu: "ア" },
        x: { kanji: "a", yomi: "ア", furu: "ア", imi: "x" },
      },
      bad: {},
    });
    expect(questions).toEqual([]);
    expect(errors).toHaveLength(5);
    expect(parseQuestions([]).errors).toHaveLength(1);
  });

  it("IDの作成と分解", () => {
    expect(makeQuestionId(49, 1)).toBe("49-1");
    expect(parseQuestionId("51-10")).toEqual({ round: 51, number: 10 });
    expect(parseQuestionId("q-0123")).toBeNull();
  });
});

describe("splitFuru", () => {
  it("太字の位置で分ける", () => {
    expect(splitFuru("ガッコウへ通う。", "ガッコウ")).toEqual({
      before: "",
      bold: "ガッコウ",
      after: "へ通う。",
    });
    expect(splitFuru("グラウンドをハシる。", "ハシ")).toEqual({
      before: "グラウンドを",
      bold: "ハシ",
      after: "る。",
    });
  });
  it("見つからなければ全体を before に", () => {
    expect(splitFuru("abc", "x")).toEqual({
      before: "abc",
      bold: "",
      after: "",
    });
  });
});
