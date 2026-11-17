import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    // PWA（設計計画書 4.2「PWA と Service Worker」）
    VitePWA({
      registerType: "prompt", // 新しい版は、出題中ではないときに利用者が押して反映する
      injectRegister: false,
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "漢字の書き取り",
        short_name: "漢字",
        description: "漢字の書き取りを手書きで練習する",
        lang: "ja",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#fafaf9",
        theme_color: "#1c1917",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        // ログイン画面への転送をキャッシュしない
        navigateFallbackDenylist: [/^\/login/, /^\/logout/, /^\/data\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // 問題データは「まずネット、だめならキャッシュ」
            urlPattern: ({ url }) => url.pathname === "/data/questions.json",
            handler: "NetworkFirst",
            options: {
              cacheName: "questions",
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
