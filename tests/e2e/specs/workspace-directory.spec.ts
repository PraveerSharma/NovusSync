import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("selects a tenant-scoped business profile and opens approved context", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/workspaces");

  await expect(page.getByRole("heading", { name: "Choose where the work happens." })).toBeVisible();
  await expect(page.getByText("Synthetic Preview fixture")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bengaluru pilot" })).toBeVisible();
  await expect(page.getByText("Northstar Yoga Studio")).toBeVisible();

  const contextLink = page.getByRole("link", {
    name: "Open approved context for Northstar Yoga Studio",
  });
  await expect(contextLink).toHaveAttribute(
    "href",
    /profileId=northstar-yoga-primary.*useCase=campaign/,
  );
  await expect(
    page.getByRole("link", { name: "Review fact freshness for Northstar Yoga Studio" }),
  ).toHaveAttribute("href", /business-profile\/reverification.*profileId=northstar-yoga-primary/);

  await contextLink.click();
  await expect(page).toHaveURL(/\/business-profile\/context\?.*profileId=northstar-yoga-primary/);
  await expect(page.locator("body")).toContainText("Approved context");
  expect(runtimeErrors).toEqual([]);
});

test("keeps the workspace directory inside the viewport", async ({ page }) => {
  await page.goto("/workspaces");
  await expect(page.getByTestId("workspace-card")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("meets the automated WCAG 2.2 AA boundary", async ({ page }) => {
  await page.goto("/workspaces");

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
