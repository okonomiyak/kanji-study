import { expect, test } from "@playwright/test";

test.describe("PWA", () => {
  test.use({ serviceWorkers: "allow" });
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "PCの Chromium で確認",
  );

  test("一度開けば、オフラインでも開けて出題できる", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "漢字の書き取り" }),
    ).toBeVisible();
    // Service Worker が有効になるまで待つ
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // SW の管理下で問題データを取得してキャッシュに入れる
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect(page.getByRole("link", { name: "出題する" })).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("link", { name: "出題する" })).toBeVisible();
    await page.getByRole("link", { name: "出題する" }).click();
    await expect(page.getByTestId("range-count")).toHaveText("129");
    await context.setOffline(false);
  });

  test("マニフェストとアイコンがある", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const m = await res.json();
    expect(m.display).toBe("standalone");
    expect((await request.get("/icons/icon-512.png")).ok()).toBe(true);
  });
});
