import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("approved context workspace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/business-profile/context");
  });

  test("shows cited facts and explicit unavailable reasons", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Use what is true. Block what is not." }),
    ).toBeVisible();
    await expect(
      page.getByTestId("context-card-business-name").getByText("Northstar Yoga Studio"),
    ).toBeVisible();
    await expect(
      page.getByTestId("context-card-trial-policy").getByText("APPROVED_CONTEXT_EXPIRED"),
    ).toBeVisible();
    await expect(
      page.getByTestId("context-card-primary-audience").getByText("APPROVED_CONTEXT_MISSING"),
    ).toBeVisible();
    await expect(page.getByTestId("metric-usable").getByText("01", { exact: true })).toBeVisible();
  });

  test("rebuilds the packet for the selected use case", async ({ page }) => {
    const bookingRoute = page.getByTestId("context-card-booking-route");
    await expect(bookingRoute).toHaveAttribute("data-context-status", "blocked");
    await expect(bookingRoute.getByText("APPROVED_CONTEXT_RESTRICTED")).toBeVisible();

    await page.getByRole("tab", { name: /Concierge response/ }).click();

    await expect(bookingRoute).toHaveAttribute("data-context-status", "usable");
    await expect(bookingRoute.getByText("Share the approved external booking link")).toBeVisible();
    await expect(page.getByTestId("metric-usable").getByText("02", { exact: true })).toBeVisible();
  });

  test("never exposes an assertion from blocked records", async ({ page }) => {
    await expect(page.getByTestId("context-card-trial-policy")).not.toContainText(
      "One complimentary beginner group class",
    );
    await expect(page.getByTestId("context-card-therapy-claim")).not.toContainText(
      "Supports injury recovery",
    );
  });

  test("meets the automated WCAG 2.2 AA boundary", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("does not overflow desktop or mobile viewports", async ({ page }) => {
    for (const size of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await page.reload();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});
