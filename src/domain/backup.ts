import { migrateBackup } from "./backup-migrations";
import type { Attempt, Session } from "./types";

export const BACKUP_FORMAT = "kanji-study-backup";
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  sessions: Session[];
  attempts: Attempt[];
}

/** 書き出し用のJSON（仕様書 7.3）。生データのみ */
export function createBackup(
  sessions: readonly Session[],
  attempts: readonly Attempt[],
  exportedAt: string,
): BackupData {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    sessions: [...sessions],
    attempts: [...attempts],
  };
}

/** ファイル名（例: kanji-backup-2026-11-17.json）。date は "YYYY-MM-DD" */
export function backupFileName(date: string): string {
  return `kanji-backup-${date}.json`;
}

export type ParseBackupError = "not-json" | "format" | "newer" | "invalid";

export type ParseBackupResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: ParseBackupError; detail?: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

function isAttempt(v: unknown): v is Attempt {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.questionId) &&
    isStr(v.sessionId) &&
    (v.mode === "normal" || v.mode === "review") &&
    typeof v.correct === "boolean" &&
    isStr(v.answeredAt) &&
    !Number.isNaN(Date.parse(v.answeredAt))
  );
}

function isSession(v: unknown): v is Session {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.startedAt) &&
    (v.mode === "normal" || v.mode === "review") &&
    typeof v.count === "number"
  );
}

/** 読み込んだJSONを検査する（仕様書 7.5）。古い版は変換、新しい版と format 違いは拒否 */
export function parseBackup(input: unknown): ParseBackupResult {
  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input);
    } catch {
      return { ok: false, error: "not-json" };
    }
  }
  if (!isObj(value) || value.format !== BACKUP_FORMAT)
    return { ok: false, error: "format" };
  const version = value.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version))
    return { ok: false, error: "invalid", detail: "schemaVersion" };
  if (version > BACKUP_SCHEMA_VERSION) return { ok: false, error: "newer" };
  const migrated = migrateBackup(value, version);
  if (!Array.isArray(migrated.sessions) || !Array.isArray(migrated.attempts))
    return { ok: false, error: "invalid" };
  const badAttempt = migrated.attempts.findIndex((a) => !isAttempt(a));
  if (badAttempt >= 0)
    return { ok: false, error: "invalid", detail: `attempts[${badAttempt}]` };
  const badSession = migrated.sessions.findIndex((s) => !isSession(s));
  if (badSession >= 0)
    return { ok: false, error: "invalid", detail: `sessions[${badSession}]` };
  return {
    ok: true,
    data: {
      format: BACKUP_FORMAT,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt:
        typeof migrated.exportedAt === "string" ? migrated.exportedAt : "",
      sessions: migrated.sessions as Session[],
      attempts: migrated.attempts as Attempt[],
    },
  };
}

export interface MergePlan {
  /** 新しく足す記録 */
  newSessions: Session[];
  newAttempts: Attempt[];
  /** すでにあった（id が同じ）件数 */
  duplicatedSessions: number;
  duplicatedAttempts: number;
}

/** 統合の計画（仕様書 7.4）。id が同じものは同一として除く。上書きはしない */
export function planMerge(
  current: { sessions: readonly Session[]; attempts: readonly Attempt[] },
  incoming: { sessions: readonly Session[]; attempts: readonly Attempt[] },
): MergePlan {
  const pick = <T extends { id: string }>(
    have: readonly T[],
    add: readonly T[],
  ) => {
    const ids = new Set(have.map((x) => x.id));
    const fresh: T[] = [];
    let dup = 0;
    for (const x of add) {
      if (ids.has(x.id)) dup++;
      else {
        ids.add(x.id);
        fresh.push(x);
      }
    }
    return { fresh, dup };
  };
  const s = pick(current.sessions, incoming.sessions);
  const a = pick(current.attempts, incoming.attempts);
  return {
    newSessions: s.fresh,
    newAttempts: a.fresh,
    duplicatedSessions: s.dup,
    duplicatedAttempts: a.dup,
  };
}
