import { test, expect } from "@playwright/test";
import { setupApp, navigateTo } from "./helpers";

test.describe("Backup", () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.waitForTimeout(500);
  });

  test("should show backup notification on dashboard", async ({ page }) => {
    await expect(
      page.getByText(/No backup configured|Nessun backup/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show Save button in app bar", async ({ page }) => {
    // The Save icon button in the toolbar
    const saveBtn = page.getByRole("button", {
      name: /Save to file|Salva su file/i,
    });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to Backup page", async ({ page }) => {
    await navigateTo(page, "Backup");
    await page.waitForTimeout(500);
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Backup|Sync/i);
  });

  test("should show archive name in app bar", async ({ page }) => {
    // The app bar should show "hkinv" (the archive name)
    const appBar = page.locator("header");
    await expect(appBar).toContainText("hkinv");
  });
});
