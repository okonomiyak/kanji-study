import { describe, expect, it } from "vitest";
import { daysBetween, localDate, toLocalIso } from "../../src/domain/time";

describe("time", () => {
  it("時差つきISOは同じ時刻を表す", () => {
    const d = new Date(Date.UTC(2026, 10, 17, 4, 45, 0));
    expect(Date.parse(toLocalIso(d))).toBe(d.getTime());
    expect(toLocalIso(d)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );
    expect(localDate(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("日数", () => {
    expect(daysBetween(new Date(0), new Date(7 * 86_400_000))).toBe(7);
  });
});
