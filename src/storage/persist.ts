/** navigator.storage.persist() の依頼と状態（仕様書 7.2） */
export type PersistState = "persisted" | "not-persisted" | "unsupported";

export async function requestPersist(): Promise<PersistState> {
  const s = globalThis.navigator?.storage;
  if (!s?.persist) return "unsupported";
  try {
    if (await s.persisted()) return "persisted";
    return (await s.persist()) ? "persisted" : "not-persisted";
  } catch {
    return "not-persisted";
  }
}
