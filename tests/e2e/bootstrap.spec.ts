import { test, expect } from "@playwright/test";

test.describe("App Bootstrap", () => {
  test("Playwright works with the project", async ({ page }) => {
    await page.goto("about:blank");
    await page.setContent("<h1>HK Invoice Manager</h1>");
    await expect(page.locator("h1")).toHaveText("HK Invoice Manager");
  });
});

