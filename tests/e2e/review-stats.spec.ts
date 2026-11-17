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
