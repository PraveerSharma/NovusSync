import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("redirects an anonymous dashboard request to invite-only sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { level: 2, name: "Open your workspace" })).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send secure link" })).toBeEnabled();
});

test("protects the business profile route for anonymous visitors", async ({ page }) => {
  await page.goto("/business-profile");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fbusiness-profile$/);
  await expect(page.getByRole("heading", { level: 2, name: "Open your workspace" })).toBeVisible();
});

test("fails closed on callback errors and never follows an external next destination", async ({
  page,
}) => {
  await page.goto("/auth/callback?next=https%3A%2F%2Fexample.com%2Fsteal");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard&state=link-error$/);
  await expect(page.getByRole("status")).toContainText("invalid or has expired");
});

test("keeps the enabled sign-in surface accessible and responsive", async ({ page }) => {
  await page.goto("/sign-in");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
