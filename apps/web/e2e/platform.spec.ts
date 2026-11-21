import { test, expect } from "@playwright/test";

test("landing page renders KasbYo‘l AI title", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page.locator("text=KasbYo‘l AI")).toBeVisible();
});
