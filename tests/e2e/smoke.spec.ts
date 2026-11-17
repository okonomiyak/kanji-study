import { expect, test } from "@playwright/test";

test("トップページが開く", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "漢字の書き取り" }),
  ).toBeVisible();
});
