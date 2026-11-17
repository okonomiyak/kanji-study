import type { Attempt, Session } from "../domain/types";
import { DRAFT_KEY } from "./drafts-repo";
import { getDB } from "./db";

export interface History {
  attempts: Attempt[];
  sessions: Session[];
}

export async function loadHistory(): Promise<History> {
  const db = await getDB();
  const [attempts, sessions] = await Promise.all([
    db.getAll("attempts"),
    db.getAll("sessions"),
  ]);
  return { attempts, sessions };
}

/**
 * 採点の確定（設計計画書 4.2）。1つのトランザクションで記録を足し、手書きのデータを消す。
 * 途中で失敗したら全部取り消される。
 */
export async function commitSession(
  session: Session,
  attempts: readonly Attempt[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["attempts", "sessions", "draft"], "readwrite");
  await Promise.all([
    tx.objectStore("sessions").put(session),
    ...attempts.map((a) => tx.objectStore("attempts").put(a)),
    tx.objectStore("draft").delete(DRAFT_KEY),
    tx.done,
  ]);
}

/** 統合用の一括追加（id が同じものは上書きせず残す前提で、呼ぶ側が重複を除いておく） */
export async function addRecords(
  sessions: readonly Session[],
  attempts: readonly Attempt[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["attempts", "sessions"], "readwrite");
  await Promise.all([
    ...sessions.map((s) => tx.objectStore("sessions").put(s)),
    ...attempts.map((a) => tx.objectStore("attempts").put(a)),
    tx.done,
  ]);
}

/** 統計データをクリア（仕様書 7.7）。解答記録・回の記録・未完了の回を消す */
export async function clearHistory(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["attempts", "sessions", "draft"], "readwrite");
  await Promise.all([
    tx.objectStore("attempts").clear(),
    tx.objectStore("sessions").clear(),
    tx.objectStore("draft").clear(),
    tx.done,
  ]);
}
