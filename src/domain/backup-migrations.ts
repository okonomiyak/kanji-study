/**
 * バックアップJSONの schemaVersion の変換（設計計画書 5.5）。
 * 版を上げるときは、ここに「v(n) → v(n+1)」の変換を足し、tests/fixtures に古い版のサンプルを残す。
 */
type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/** MIGRATIONS[n] は v(n) → v(n+1) の変換 */
const MIGRATIONS: Record<number, Migration> = {};

export function migrateBackup(
  data: Record<string, unknown>,
  fromVersion: number,
): Record<string, unknown> {
  let out = data;
  for (let v = fromVersion; ; v++) {
    const m = MIGRATIONS[v];
    if (!m) break;
    out = m(out);
  }
  return out;
}
