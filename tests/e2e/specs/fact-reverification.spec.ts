import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("fact freshness workspace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/business-profile/reverification");
  });

  test("prioritizes expired and due-soon facts without enabling synthetic writes", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await expect(page.getByRole("heading", { name: "Keep every promise current." })).toBeVisible();
    await expect(page.getByText("Synthetic Preview", { exact: true })).toBeVisible();
    await expect(page.getByTestId("metric-critical")).toContainText("01");
    await expect(page.getByTestId("metric-warning")).toContainText("01");
    await expect(page.getByTestId("freshness-card-expired")).toContainText("Offer Price");
    await expect(page.getByTestId("freshness-card-due_soon")).toContainText("Booking Route Label");
    await expect(
      page.getByRole("button", { name: "Owner action in live workspace" }).first(),
    ).toBeDisabled();
    expect(runtimeErrors).toEqual([]);
  });

  test("meets WCAG 2.2 AA and viewport containment", async ({ page }) => {
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
