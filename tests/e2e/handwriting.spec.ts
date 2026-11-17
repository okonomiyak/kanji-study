import { expect, test, type Page } from "@playwright/test";
import { inkPixels } from "./helpers";

async function drawLine(page: Page) {
  const box = (await page.locator("canvas").first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(
      box.x + box.width * (0.2 + i * 0.06),
      box.y + box.height * 0.5,
    );
  await page.mouse.up();
}

test.describe("試し書き", () => {
  test.skip(({ isMobile }) => isMobile, "マウス操作はPCのみ");

  test("書く・消す・1つ戻す・全部消す", async ({ page }) => {
    await page.goto("/#/trial");
    await expect(page.locator("canvas")).toBeVisible();
    const box = (await page.locator("canvas").boundingBox())!;
    expect(Math.round(box.width)).toBe(Math.round(box.height)); // 正方形

    await drawLine(page);
    const afterPen = await inkPixels(page);
    expect(afterPen).toBeGreaterThan(100);

    await page.getByRole("button", { name: "全部消す" }).click();
    expect(await inkPixels(page)).toBe(0);
    await page.getByRole("button", { name: "1つ戻す" }).click();
    expect(await inkPixels(page)).toBe(afterPen);

    await page.getByRole("button", { name: "消しゴム" }).click();
    await drawLine(page);
    expect(await inkPixels(page)).toBeLessThan(afterPen);
    await page.getByRole("button", { name: "1つ戻す" }).click();
    expect(await inkPixels(page)).toBe(afterPen);
  });

  test("大きさが変わっても線が残る", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/#/trial");
    await drawLine(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect.poll(() => inkPixels(page)).toBeGreaterThan(100);
  });
});

test("ペン入力のみのときは指の入力を無視する", async ({ page }) => {
  await page.goto("/#/trial");
  await page.getByLabel("ペン入力のみ").check();
  const draw = (pointerType: string) =>
    page.locator("canvas").evaluate((c, pointerType) => {
      const r = c.getBoundingClientRect();
      const ev = (type: string, x: number) =>
        c.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 7,
            pointerType,
            clientX: r.left + r.width * x,
            clientY: r.top + r.height / 2,
            bubbles: true,
            cancelable: true,
          }),
        );
      ev("pointerdown", 0.2);
      ev("pointermove", 0.5);
      ev("pointermove", 0.8);
      ev("pointerup", 0.8);
    }, pointerType);
  await draw("touch");
  expect(await inkPixels(page)).toBe(0);
  await draw("pen");
  expect(await inkPixels(page)).toBeGreaterThan(50);
});

test.describe("やり直し", () => {
  test.skip(({ isMobile }) => isMobile, "マウス操作はPCのみ");

  test("1つ戻した操作をやり直せる。新しく書くとやり直せなくなる", async ({
    page,
  }) => {
    await page.goto("/#/trial");
    const redo = page.getByRole("button", { name: "やり直す" });
    await expect(redo).toBeDisabled();
    await drawLine(page);
    const afterPen = await inkPixels(page);
    await page.getByRole("button", { name: "1つ戻す" }).click();
    expect(await inkPixels(page)).toBe(0);
    await expect(redo).toBeEnabled();
    await redo.click();
    expect(await inkPixels(page)).toBe(afterPen);
    await expect(redo).toBeDisabled();

    await page.getByRole("button", { name: "1つ戻す" }).click();
    await drawLine(page);
    await expect(redo).toBeDisabled();
  });
});
