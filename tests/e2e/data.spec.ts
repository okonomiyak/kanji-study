import { expect, test } from "@playwright/test";

test.describe("データ管理", () => {
  test.skip(({ isMobile }) => isMobile, "ダウンロードはPCで確認");

  test("書き出し → クリア → 読み込み（統合、2回目は増えない）", async ({
    page,
  }) => {
    // 1問解いて記録を作る
    await page.goto("/#/setup");
    await page.getByRole("button", { name: /第50回/ }).click();
    await page.getByLabel("自由に決める").check();
    await page.getByLabel("問題数").fill("1");
    await page.getByRole("button", { name: "1 問で始める" }).click();
    await page.getByRole("button", { name: "採点へ進む" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "採点へ進む" })
      .click();
    await page.getByRole("button", { name: "不正解（×）" }).click();
    await page.getByRole("button", { name: "採点を確定" }).click();
    await page.getByRole("button", { name: "ホームへ" }).click();

    // 書き出していないので警告が出る
    await expect(page.getByText("まだJSONを書き出していません")).toBeVisible();

    await page.getByRole("link", { name: "設定" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "JSONを書き出す" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^kanji-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const file = await download.path();

    // クリア: 「クリア」と入力するまで押せない
    await page.getByRole("button", { name: "統計データをクリア…" }).click();
    const clearBtn = page.getByRole("button", { name: "クリアする" });
    await expect(clearBtn).toBeDisabled();
    await page.getByLabel("確認の入力").fill("クリア");
    await clearBtn.click();
    await expect(page.getByText("解答記録 0 件")).toBeVisible();

    // 読み込み
    await page.getByRole("button", { name: "JSONを読み込む（統合）" }).click();
    await page.getByLabel("バックアップファイル").setInputFiles(file);
    await expect(page.getByTestId("import-plan")).toContainText(
      "追加される解答記録: 1 件",
    );
    await page.getByRole("button", { name: "統合する" }).click();
    await expect(page.getByText("解答記録 1 件")).toBeVisible();

    // 同じファイルをもう一度: 増えない
    await page.getByRole("button", { name: "JSONを読み込む（統合）" }).click();
    await page.getByLabel("バックアップファイル").setInputFiles(file);
    await expect(page.getByTestId("import-plan")).toContainText(
      "重複していた解答記録: 1 件",
    );
    await expect(page.getByRole("button", { name: "統合する" })).toBeDisabled();
    await page.getByRole("button", { name: "やめる" }).click();

    // 復習リストも統合後の記録から計算される
    await page.goto("/");
    await expect(page.getByTestId("review-count")).toHaveText("1");
  });

  test("違う形式のファイルは読み込まない", async ({ page }) => {
    await page.goto("/#/settings");
    await page.getByRole("button", { name: "JSONを読み込む（統合）" }).click();
    await page.getByLabel("バックアップファイル").setInputFiles({
      name: "x.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "kanji-study-backup",
          schemaVersion: 99,
          sessions: [],
          attempts: [],
        }),
      ),
    });
    await expect(page.getByRole("alert")).toContainText(
      "アプリを更新してください",
    );
  });

  test("書き出しから7日たつとホームに警告が出る", async ({ page }) => {
    await page.goto("/#/setup");
    await page.getByRole("button", { name: /第50回/ }).click();
    await page.getByLabel("自由に決める").check();
    await page.getByLabel("問題数").fill("1");
    await page.getByRole("button", { name: "1 問で始める" }).click();
    await page.getByRole("button", { name: "採点へ進む" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "採点へ進む" })
      .click();
    await page.getByRole("button", { name: "正解（○）" }).click();
    await page.getByRole("button", { name: "採点を確定" }).click();
    await page.evaluate(() =>
      localStorage.setItem(
        "kanji-study:last-export-at",
        new Date(Date.now() - 8 * 86_400_000).toISOString(),
      ),
    );
    await page.goto("/");
    await expect(
      page.getByText("最後の書き出しから 8 日たちました"),
    ).toBeVisible();
  });
});
