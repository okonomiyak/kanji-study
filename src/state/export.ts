import { backupFileName, createBackup } from "../domain/backup";
import { localDate, toLocalIso } from "../domain/time";
import { setLastExportAt } from "../storage/meta";
import { history } from "./history.svelte";

/**
 * 統計データをJSONで書き出す（仕様書 7.3）。iPad では共有シート（「ファイル」に保存、AirDrop）を使い、
 * 使えないときはダウンロードにする。
 */
export async function exportBackup(): Promise<
  "shared" | "downloaded" | "cancelled"
> {
  const now = new Date();
  const data = createBackup(
    history.sessions,
    history.attempts,
    toLocalIso(now),
  );
  const name = backupFileName(localDate(now));
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const file = new File([blob], name, { type: "application/json" });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (
    nav.canShare?.({ files: [file] }) &&
    /iPad|iPhone|Macintosh/.test(navigator.userAgent) &&
    "ontouchend" in document
  ) {
    try {
      await navigator.share({ files: [file], title: name });
      setLastExportAt(now);
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError")
        return "cancelled";
      // 共有に失敗したらダウンロードにする
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  setLastExportAt(now);
  return "downloaded";
}
