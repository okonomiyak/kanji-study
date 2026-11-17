import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  readCookie,
  safeNext,
  timingSafeEqual,
  verifySessionValue,
} from "../../functions/lib/session-cookie";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

describe("session cookie", () => {
  it("発行した値は検証が通る", async () => {
    const v = await createSessionValue(SECRET, NOW);
    expect(await verifySessionValue(SECRET, v, NOW + 1000)).toBe(true);
  });

  it("期限切れは無効", async () => {
    const v = await createSessionValue(SECRET, NOW, 60);
    expect(await verifySessionValue(SECRET, v, NOW + 61_000)).toBe(false);
  });

  it("書き換えると無効", async () => {
    const v = await createSessionValue(SECRET, NOW, 60);
    const parts = v.split(".");
    parts[2] = String(Number(parts[2]) + 10_000_000);
    expect(await verifySessionValue(SECRET, parts.join("."), NOW)).toBe(false);
    expect(await verifySessionValue(SECRET, v.slice(0, -1) + "A", NOW)).toBe(
      false,
    );
  });

  it("AUTH_SECRET を変えると無効", async () => {
    const v = await createSessionValue(SECRET, NOW);
    expect(await verifySessionValue("other", v, NOW)).toBe(false);
  });

  it("形の違う値は無効", async () => {
    for (const bad of [
      undefined,
      "",
      "abc",
      "v1.1.2",
      "v2.1.2.x",
      "v1.a.b.c",
    ]) {
      expect(await verifySessionValue(SECRET, bad, NOW)).toBe(false);
    }
  });
});

describe("helpers", () => {
  it("timingSafeEqual", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("readCookie", () => {
    expect(readCookie("a=1; kanji_session=xyz; b=2", "kanji_session")).toBe(
      "xyz",
    );
    expect(readCookie(null, "kanji_session")).toBeUndefined();
    expect(readCookie("a=1", "kanji_session")).toBeUndefined();
  });

  it("safeNext は外部への転送を許さない", () => {
    expect(safeNext("/#/quiz")).toBe("/#/quiz");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil")).toBe("/");
    expect(safeNext("/login")).toBe("/");
    expect(safeNext(null)).toBe("/");
    // ブラウザがタブ・改行を取り除くと "//evil.example" になる値
    expect(safeNext("/\t/evil.example")).toBe("/");
    expect(safeNext("/\n/evil.example")).toBe("/");
    expect(safeNext("/ /evil.example")).toBe("/");
  });
});
