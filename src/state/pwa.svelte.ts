import { registerSW } from "virtual:pwa-register";

/** Service Worker の登録と「更新があります」（設計計画書 4.2） */
class PwaState {
  needRefresh = $state(false);
  offlineReady = $state(false);
  #update: ((reload?: boolean) => Promise<void>) | null = null;

  register() {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
    this.#update = registerSW({
      onNeedRefresh: () => (this.needRefresh = true),
      onOfflineReady: () => (this.offlineReady = true),
      onRegisteredSW: (_url, reg) => {
        // 開いたままでも1時間ごとに新しい版を確かめる
        if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
      },
    });
  }

  /** 新しい版を反映して再読み込みする（出題中は呼ばない） */
  async applyUpdate() {
    await this.#update?.(true);
  }
}

export const pwa = new PwaState();

/** ホーム画面に追加して開いているか */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad の Safari か（iPadOS はデスクトップの UA を名乗るのでタッチで見分ける） */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}
