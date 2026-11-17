import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Attempt, Session } from "../domain/types";
import type { Draft } from "./drafts-repo";

/** IndexedDB の定義（設計計画書 4.2 storage）。版を上げるときの変換もここに集める */
export const DB_NAME = "kanji-study";
export const DB_VERSION = 1;

export interface KanjiDB extends DBSchema {
  attempts: {
    key: string;
    value: Attempt;
    indexes: { questionId: string; answeredAt: string };
  };
  sessions: { key: string; value: Session };
  draft: { key: string; value: Draft };
}

let dbPromise: Promise<IDBPDatabase<KanjiDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<KanjiDB>> {
  dbPromise ??= openDB<KanjiDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const attempts = db.createObjectStore("attempts", { keyPath: "id" });
        attempts.createIndex("questionId", "questionId");
        attempts.createIndex("answeredAt", "answeredAt");
        db.createObjectStore("sessions", { keyPath: "id" });
        db.createObjectStore("draft");
      }
    },
  });
  return dbPromise;
}

/** テスト用: 接続を閉じて作り直せるようにする */
export async function resetDBConnection() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}
