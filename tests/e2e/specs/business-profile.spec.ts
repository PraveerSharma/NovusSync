import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/business-profile");
});

test("guides an empty profile through browser-only save and restore", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Teach NovusSync what is true." }),
  ).toBeVisible();
  await expect(page.getByText("Browser-only synthetic draft")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

  const businessName = page.getByLabel("Business name");
  await expect(businessName).toHaveAttribute("aria-invalid", "false");
  await businessName.fill(" ");
  await expect(businessName).toHaveAttribute("aria-invalid", "true");
  await businessName.fill("Northstar Yoga");
  await expect(businessName).toHaveAttribute("aria-invalid", "false");
  await page
    .getByLabel("Business summary")
    .fill("Small-group yoga instruction using owner-approved class information.");
  await page.getByLabel("Primary location").fill("Bengaluru, India");
  await page.getByRole("button", { name: /02 Offer/ }).click();
  await page.getByLabel("Introductory offer").fill("One beginner group trial class.");
  await page.getByLabel("Offer price").fill("INR 500");
  await page.getByRole("button", { name: "Save browser draft" }).click();

  await expect(page.getByRole("status")).toHaveText("Draft saved in this browser only");
  await expect(page.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow", "0");

  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Draft restored from this browser");
  await page.getByRole("button", { name: /01 Business/ }).click();
  await expect(page.getByLabel("Business name")).toHaveValue("Northstar Yoga");
});

test("supports keyboard entry, responsive layout, and WCAG 2.2 AA automation", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to profile editor" })).toBeFocused();
  await page.getByRole("link", { name: "Skip to profile editor" }).press("Enter");
  await expect(page.locator("#profile-main")).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
