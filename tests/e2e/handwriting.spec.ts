import { expect, test, type Page } from "@playwright/test";

/** canvas に描かれた（透明でない）画素の数 */
async function inkPixels(page: Page) {
  return page
    .locator("canvas")
    .first()
    .evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
      return n;
    });
}

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
