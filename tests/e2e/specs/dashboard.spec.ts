import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("operates the synthetic attention queue without external effects", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { level: 1, name: "Keep every customer handoff moving." }),
  ).toBeVisible();
  await expect(page.getByLabel("Synthetic workspace with external effects denied")).toBeVisible();

  await page.getByRole("button", { name: /Approvals 2/ }).click();
  await expect(page.getByRole("button", { name: /Daniel Cho/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Amara Chen/ })).toBeVisible();

  await page.getByRole("button", { name: /Amara Chen/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Amara Chen" })).toBeVisible();
  await expect(page.getByText("Decision required: Welcome offer")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search open leads" }).fill("no matching customer");
  await expect(page.getByText("No matching work.")).toBeVisible();
});

test("has a responsive, accessible dashboard surface", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(page.getByRole("main")).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
