import { expect, test } from "@playwright/test";
import { answerOne, drawOn, inkPixels } from "./helpers";

test("間違えた問題を、漢字を見たり隠したりしながら練習できる。記録は増えない", async ({
  page,
}) => {
  await page.goto("/#/practice");
  await expect(page.getByText("練習する問題はありません")).toBeVisible();

  await answerOne(page, false, "setup", 49);
  await expect(page.getByTestId("review-count")).toHaveText("1");
  await page.getByRole("link", { name: "間違えた問題を練習する" }).click();

  await expect(page.getByTestId("progress")).toHaveText("1 / 1");
  await expect(page.getByTestId("furu")).toBeVisible();
  const kanji = page.getByTestId("practice-kanji");
  await expect(kanji).toBeVisible();

  await page.getByRole("button", { name: "漢字を隠す" }).click();
  await expect(kanji).toBeHidden();
  await expect(page.getByTestId("practice-kanji-hidden")).toBeVisible();
  await page.getByRole("button", { name: "漢字を見る" }).click();
  await expect(kanji).toBeVisible();

  await drawOn(page);
  await expect.poll(() => inkPixels(page)).toBeGreaterThan(50);
  await page.getByRole("button", { name: "1つ戻す" }).click();
  await expect.poll(() => inkPixels(page)).toBe(0);

  await page.getByLabel("練習する問題").selectOption("missed");
  await expect(page.getByTestId("progress")).toHaveText("1 / 1");

  // 練習は記録に残らない
  await page.getByRole("link", { name: "戻る" }).click();
  await expect(page.getByTestId("review-count")).toHaveText("1");
  await expect(page.getByText("これまでの解答: 1 問")).toBeVisible();
});
