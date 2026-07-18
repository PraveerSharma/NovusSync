import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("keeps invitation email disabled until provider readiness is approved", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(
    page.getByRole("heading", { level: 1, name: /every decision accounted for/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Provider verification pending" })).toBeDisabled();
  await expect(page.getByLabel("Work email")).toHaveCount(0);
  await expect(page.getByText("External effects remain denied")).toBeVisible();
});

test("renders the staged access surface without accessibility or mobile overflow defects", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
