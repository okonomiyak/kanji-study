import { expect, type Page } from "@playwright/test";

/** canvas にペンで横線を1本引く（合成した Pointer Events。端末の種類によらず動く） */
export async function drawOn(page: Page, selector = "canvas") {
  await page
    .locator(selector)
    .first()
    .evaluate((c) => {
      const r = c.getBoundingClientRect();
      const ev = (type: string, x: number) =>
        c.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 9,
            pointerType: "pen",
            clientX: r.left + r.width * x,
            clientY: r.top + r.height * 0.5,
            bubbles: true,
            cancelable: true,
          }),
        );
      ev("pointerdown", 0.2);
      for (let i = 1; i <= 6; i++) ev("pointermove", 0.2 + i * 0.1);
      ev("pointerup", 0.8);
    });
}

/** canvas に描かれた画素の数 */
export async function inkPixels(page: Page, selector = "canvas") {
  return page
    .locator(selector)
    .first()
    .evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
      return n;
    });
}

/** 1問だけ出題して、○か×で確定する */
export async function answerOne(
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
