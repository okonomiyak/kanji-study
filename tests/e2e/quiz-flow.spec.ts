import { expect, test, type Page } from "@playwright/test";
import { drawOn, inkPixels } from "./helpers";

async function startThreeQuestions(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "出題する" }).click();
  await page.getByRole("button", { name: /第49回/ }).click();
  await expect(page.getByTestId("range-count")).toHaveText("22");
  await page.getByLabel("自由に決める").check();
  await page.getByLabel("問題数").fill("3");
  await page.getByRole("button", { name: "3 問で始める" }).click();
  await expect(page.getByTestId("progress")).toHaveText("1 / 3");
}

test("出題 → 手書き → ○× → 確定 → 間違えた問題だけもう一度", async ({
  page,
}) => {
  await startThreeQuestions(page);
  await expect(page.locator("strong").first()).toBeVisible(); // 太字の読み

  await drawOn(page);
  await page.getByRole("button", { name: "次の問題" }).click();
  await drawOn(page);
  await page.getByRole("button", { name: "次の問題" }).click();
  await expect(page.getByTestId("progress")).toHaveText("3 / 3");

  // 前の問題に戻っても書いた内容が残る
  await page.getByRole("button", { name: "前の問題" }).click();
  await expect.poll(() => inkPixels(page)).toBeGreaterThan(50);
  await page.getByRole("button", { name: "次の問題" }).click();

  // 未記入があると確認が出る
  await page.getByRole("button", { name: "採点へ進む" }).click();
  await expect(page.getByRole("dialog")).toContainText("3問目");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "採点へ進む" })
    .click();

  await expect(page.getByRole("heading", { name: "自己採点" })).toBeVisible();
  await expect(page.getByTestId("correct-kanji")).toBeVisible();
  const confirmBtn = page.getByRole("button", { name: "採点を確定" });
  await page.getByRole("button", { name: "正解（○）" }).click();
  await page.getByRole("button", { name: "不正解（×）" }).click();
  await expect(confirmBtn).toBeDisabled();
  await page.getByRole("button", { name: "正解（○）" }).click();
  await confirmBtn.click();

  await expect(page.getByTestId("score")).toContainText("2");
  await expect(page.getByTestId("score")).toContainText("/ 3 問");
  await page.getByRole("button", { name: "間違えた問題だけもう一度" }).click();
  await expect(page.getByTestId("progress")).toHaveText("1 / 1");

  // 解答記録が増え、復習リストに1件入っている
  await page.getByRole("button", { name: "中断" }).click();
  await page.getByRole("button", { name: "破棄する" }).click();
  await expect(page.getByTestId("review-count")).toHaveText("1");
  await expect(page.getByText("これまでの解答: 3 問")).toBeVisible();
});

test("解答中に再読み込みしても手書きと位置が残り、再開できる", async ({
  page,
}) => {
  await startThreeQuestions(page);
  await page.getByRole("button", { name: "次の問題" }).click();
  await drawOn(page);
  await page.waitForTimeout(800); // 自動保存（0.5秒後）を待つ
  await page.reload();

  await expect(page.getByRole("status")).toContainText("途中の回");
  await page.getByRole("button", { name: "続きから再開する" }).click();
  await expect(page.getByTestId("progress")).toHaveText("2 / 3");
  await expect.poll(() => inkPixels(page)).toBeGreaterThan(50);
});

test("最後に使った出題範囲が次回の初期値になる", async ({ page }) => {
  await startThreeQuestions(page);
  await page.getByRole("button", { name: "中断" }).click();
  await page.getByRole("button", { name: "破棄する" }).click();
  await page.getByRole("link", { name: "出題する" }).click();
  await expect(page.getByTestId("range-count")).toHaveText("22");
  await expect(page.getByLabel("問題数")).toHaveValue("3");
});
