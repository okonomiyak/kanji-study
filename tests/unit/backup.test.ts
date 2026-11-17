import { describe, expect, it } from "vitest";
import {
  backupFileName,
  createBackup,
  parseBackup,
  planMerge,
} from "../../src/domain/backup";
import type { Session } from "../../src/domain/types";
import { att } from "./helpers";

const session = (id: string): Session => ({
  id,
  startedAt: "2026-11-17T20:00:00+09:00",
  mode: "normal",
  count: 1,
});

describe("バックアップ", () => {
  const attempts = [att("49-1", true, 1), att("49-2", false, 1)];
  const backup = createBackup(
    [session("s1")],
    attempts,
    "2026-11-17T21:00:00+09:00",
  );

  it("書き出して読み込める", () => {
    const r = parseBackup(JSON.stringify(backup));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.attempts).toEqual(attempts);
    expect(backupFileName("2026-11-17")).toBe("kanji-backup-2026-11-17.json");
  });

  it("同じファイルを2回統合しても増えない", () => {
    const first = planMerge({ sessions: [], attempts: [] }, backup);
    expect(first.newAttempts).toHaveLength(2);
    const after = { sessions: first.newSessions, attempts: first.newAttempts };
    const second = planMerge(after, backup);
    expect(second.newAttempts).toHaveLength(0);
    expect(second.duplicatedAttempts).toBe(2);
    expect(second.duplicatedSessions).toBe(1);
  });

  it("違うものはすべて追加する", () => {
    const other = createBackup([session("s2")], [att("50-1", true, 2)], "x");
    const plan = planMerge(backup, other);
    expect(plan.newAttempts).toHaveLength(1);
    expect(plan.newSessions).toHaveLength(1);
  });

  it("新しい schemaVersion は拒否", () => {
    expect(parseBackup({ ...backup, schemaVersion: 2 })).toEqual({
      ok: false,
      error: "newer",
    });
  });

  it("format 違い・JSONでない・壊れた記録は拒否", () => {
    expect(parseBackup({ ...backup, format: "other" })).toEqual({
      ok: false,
      error: "format",
    });
    expect(parseBackup("{")).toEqual({ ok: false, error: "not-json" });
    const broken = { ...backup, attempts: [{ id: "x" }] };
    expect(parseBackup(broken)).toMatchObject({ ok: false, error: "invalid" });
  });
});
