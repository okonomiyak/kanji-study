import { expect, test, type Page } from "@playwright/test";

/** 1問だけ出題して、○か×で確定する */
async function answerOne(
  page: Page,
  correct: boolean,
  from: "setup" | "review" = "setup",
) {
  if (from === "setup") {
    await page.goto("/#/setup");
    await page.getByRole("button", { name: /第49回/ }).click();
    await page.getByLabel("自由に決める").check();
    await page.getByLabel("問題数").fill("1");
    await page.getByRole("button", { name: "1 問で始める" }).click();
  } else {
    await page.goto("/#/review");
    await page.getByLabel("自由に決める").check();
    await page.getByLabel("問題数").fill("1");
    await page.getByRole("button", { name: "1 問で復習を始める" }).click();
  }
  await page.getByRole("button", { name: "採点へ進む" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "採点へ進む" })
    .click();
  await page
    .getByRole("button", { name: correct ? "正解（○）" : "不正解（×）" })
    .click();
  await page.getByRole("button", { name: "採点を確定" }).click();
  await expect(page.getByTestId("score")).toBeVisible();
  await page.getByRole("button", { name: "ホームへ" }).click();
}

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
