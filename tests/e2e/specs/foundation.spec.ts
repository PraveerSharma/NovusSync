import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("renders the responsive foundation console without visual regressions", async ({
  page,
}, testInfo) => {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build the operating layer before the automation.",
    }),
  ).toBeVisible();
  await expect(page.getByText("0", { exact: true })).toBeVisible();
  await expect(page.getByText("live external effects", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);

  await expect(page).toHaveScreenshot(`foundation-${testInfo.project.name}.png`, {
    animations: "disabled",
    fullPage: true,
  });
});

test("supports keyboard skip navigation and clear focus", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const boundaryLink = page.getByRole("link", { name: "Review system boundary" });
  await boundaryLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#boundary$/);
});

test("has no automatically detectable WCAG A or AA violations", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
