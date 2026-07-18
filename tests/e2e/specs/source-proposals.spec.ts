import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Business Profile source proposals", () => {
  test("keeps website and booking suggestions provisional", async ({ page }) => {
    await page.goto("/business-profile");

    const launcher = page.getByRole("button", { name: /source proposals/i });
    await expect(launcher).toBeVisible();
    await launcher.click();

    const dialog = page.getByRole("dialog", { name: "Review source proposals" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Synthetic, minimized data")).toBeVisible();
    await expect(dialog.getByText("Business summary")).toBeVisible();
    await expect(dialog.getByText("Provisional").first()).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
      .include("#source-proposal-drawer")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);

    await dialog.getByRole("tab", { name: /booking route/i }).click();
    await expect(dialog.getByText("Stale source label")).toBeVisible();
    await dialog.getByRole("button", { name: "Review proposal" }).click();
    await expect(dialog.getByText("No verified value recorded")).toBeVisible();
    await dialog.getByRole("button", { name: "Queue for owner review" }).click();
    await expect(dialog.getByRole("button", { name: "Queued for owner review" })).toBeDisabled();
    await expect(dialog.getByText("Queueing does not change the Business Profile")).toBeVisible();
  });
});
