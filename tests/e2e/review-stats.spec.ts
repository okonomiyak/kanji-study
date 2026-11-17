import { expect, test } from "@playwright/test";
import { answerOne } from "./helpers";

test("× で復習リストに入り、3回続けて ○ で外れる。統計にも反映される", async ({
  page,
}) => {
  await page.goto("/");
  await answerOne(page, false);
  await expect(page.getByTestId("review-count")).toHaveText("1");

  for (let i = 0; i < 2; i++) await answerOne(page, true, "review");
  await expect(page.getByTestId("review-count")).toHaveText("1");
  await expect(
    page.getByText("連続正解 0回: 0 / 1回: 0 / 2回: 1"),
  ).toBeVisible();
  await answerOne(page, true, "review");
  await expect(page.getByTestId("review-count")).toHaveText("0");

  await page.getByRole("link", { name: "統計" }).click();
  await expect(page.getByTestId("total")).toHaveText("4");
  await expect(page.getByTestId("rate")).toHaveText("75%");
  // 2回以上解いて間違えたことがあるので苦手な漢字に出る
  await expect(page.getByTestId("weak-list").getByRole("listitem")).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "全部選ぶ" }).click();
  await page.getByRole("button", { name: "選んだ 1 問を出題" }).click();
  await expect(page.getByTestId("progress")).toHaveText("1 / 1");
});

test("途中の回があるときに復習を始めると、破棄してよいかを聞く", async ({
  page,
}) => {
  await answerOne(page, false); // 復習リストに1件
  await page.goto("/#/setup");
  await page.getByRole("button", { name: /第50回/ }).click();
  await page.getByRole("button", { name: /問で始める/ }).click();
  await page.getByRole("button", { name: "中断" }).click();
  await page.getByRole("button", { name: "あとで再開" }).click();

  await page.getByRole("link", { name: /復習する/ }).click();
  await page.getByRole("button", { name: /で復習を始める/ }).click();
  await expect(page.getByRole("dialog")).toContainText("途中の回があります");
  await page.getByRole("button", { name: "やめる" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: /で復習を始める/ }).click();
  await page.getByRole("button", { name: "破棄して始める" }).click();
  await expect(page.getByTestId("progress")).toHaveText("1 / 1");
});

test("統計の漢字ごとの一覧を並べ替えられる", async ({ page }) => {
  await answerOne(page, false, "setup", 49);
  await answerOne(page, true, "setup", 50);
  await page.getByRole("link", { name: "統計" }).click();
  await page.getByRole("tab", { name: "漢字ごと" }).click();
  const firstId = page.locator("tbody tr").first().locator("td").first();
  await expect(firstId).toHaveText(/^49-/); // 問題の順

  await page.getByRole("button", { name: /^正答率/ }).click(); // 低い順
  await expect(firstId).toHaveText(/^49-/);
  await page.getByRole("button", { name: /^正答率/ }).click(); // 高い順
  await expect(firstId).toHaveText(/^50-/);
  await expect(
    page.getByRole("columnheader", { name: /正答率/ }),
  ).toHaveAttribute("aria-sort", "descending");

  await page.getByLabel("並べ替え").selectOption("wrong"); // 間違いの多い順
  await expect(firstId).toHaveText(/^49-/);
  await page.getByTestId("sort-dir").click();
  await expect(firstId).toHaveText(/^50-/);
});

test("統計の漢字ごとの一覧を回や結果で絞り込める", async ({ page }) => {
  await answerOne(page, false, "setup", 49);
  await answerOne(page, true, "setup", 50);
  await page.getByRole("link", { name: "統計" }).click();
  await page.getByRole("tab", { name: "漢字ごと" }).click();
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(2);

  await page.getByLabel("回で絞り込む").selectOption("第50回");
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator("td").first()).toHaveText(/^50-/);
  await expect(page.getByTestId("filter-count")).toHaveText("1 / 2 件");

  await page.getByLabel("回で絞り込む").selectOption("すべての回");
  await page.getByLabel("結果で絞り込む").selectOption("間違えたことがある");
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator("td").first()).toHaveText(/^49-/);

  await page.getByRole("button", { name: "絞り込みを外す" }).click();
  await expect(rows).toHaveCount(2);
});
