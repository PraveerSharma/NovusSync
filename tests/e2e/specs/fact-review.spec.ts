import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Business Profile fact review", () => {
  test("records verify, conflict resolution, and rejection outcomes without external effects", async ({
    page,
  }) => {
    await page.goto("/business-profile/review");
    await expect(page.getByRole("heading", { name: "Decide what becomes true." })).toBeVisible();
    await expect(page.getByText("BRN-003A does not write the database")).toBeVisible();

    await page.getByRole("button", { name: /Business name/ }).click();
    await page.getByRole("button", { name: "Verify source value" }).click();
    await expect(page.getByText("Business name is staged as approved version 1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decision history" })).toBeVisible();
    await expect(page.getByText("Verified source value")).toBeVisible();

    await page.getByRole("button", { name: /Trial policy/ }).click();
    await page.getByRole("button", { name: "Resolve conflict" }).click();
    await page.getByLabel("Keep current approved value").check();
    await page.getByLabel("Resolution reason").selectOption("CURRENT_POLICY_CONFIRMED");
    await page.getByRole("button", { name: "Record resolution" }).click();
    await expect(page.getByText("Trial policy is staged as approved version 1")).toBeVisible();
    await expect(
      page
        .getByLabel("Record one explicit outcome")
        .getByText("Introductory class is ₹299", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Booking route label/ }).click();
    await page.getByRole("button", { name: "Reject proposal" }).click();
    await page.getByLabel("Rejection reason").selectOption("SOURCE_OUTDATED");
    await page.getByRole("button", { name: "Confirm rejection" }).click();
    await expect(page.getByText("Booking route label is staged as rejected")).toBeVisible();
    await expect(page.getByText("No fact version created")).toBeVisible();
  });

  test("keeps the review surface responsive, keyboard reachable, and WCAG 2.2 AA clean", async ({
    page,
  }) => {
    await page.goto("/business-profile/review");
    await page.getByRole("button", { name: /Trial policy/ }).click();
    await page.getByRole("button", { name: "Resolve conflict" }).click();

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe("BODY");
  });
});
