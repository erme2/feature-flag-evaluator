import { test, expect } from "@playwright/test";
test("edit, reorder, evaluate, refresh and reset", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const checkout = page.getByRole("article", { name: "new_checkout" });
  await expect(checkout.locator(".ffe-result")).toContainText("variant_a");
  await checkout.getByRole("button", { name: "Move rule 2 up" }).click();
  await expect(checkout.locator(".ffe-result")).toContainText("variant_b");
  await checkout
    .getByRole("button", { name: "Edit rule 1", exact: true })
    .click();
  await page.getByLabel("Returned variant").fill("updated_variant");
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.reload();
  await expect(checkout.locator(".ffe-result")).toContainText(
    "updated_variant",
  );
  await page.getByLabel("Context value 1").fill("FR");
  await expect(checkout.locator(".ffe-result")).toContainText("control");
  await checkout
    .getByRole("button", { name: "Edit rule 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  await page.getByLabel("Attribute 2", { exact: true }).fill("plan");
  await page.getByLabel("Value 2", { exact: true }).fill("pro");
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Reset flags", exact: true }).click();
  await page.getByLabel("Context value 1").fill("UK");
  await expect(checkout.locator(".ffe-result")).toContainText("variant_a");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("widget.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("fits a narrow host on desktop and supports an open editor", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.locator(".ffe").evaluate((element) => {
    (element as HTMLElement).style.width = "320px";
  });
  await page
    .getByRole("article", { name: "new_checkout" })
    .getByRole("button", { name: "Edit rule 1", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Save rule" })).toBeVisible();
  expect(
    await page
      .locator(".ffe")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("embedded.png"),
    fullPage: true,
  });
});
