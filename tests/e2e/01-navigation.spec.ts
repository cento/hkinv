import { test, expect } from "@playwright/test";
import { setupApp, navigateTo } from "./helpers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.waitForTimeout(500);
  });

  test("should show the sidebar with all navigation items", async ({
    page,
  }) => {
    const navItems = [
      "Dashboard",
      "Invoices",
      "Customers",
      "Payment profiles",
      "Tax Reports",
      "Backup",
      "Settings",
    ];
    for (const item of navItems) {
      await expect(page.getByText(item).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should navigate to each page via sidebar", async ({ page }) => {
    // Use the helpers' navigateTo function which clicks sidebar items
    await navigateTo(page, "Invoices");
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Invoice|Fattur/i);

    await navigateTo(page, "Customers");
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Customer|Client/i);

    await navigateTo(page, "Payment profiles");
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Payment|Profil|Pagamento/i);

    await navigateTo(page, "Tax Reports");
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Tax|Tasse|Fiscal/i);

    await navigateTo(page, "Settings");
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Settings|Impostazion/i);
  });

  test("should show app title in app bar", async ({ page }) => {
    // The app bar contains "HK Invoice Manager" heading
    const appBar = page.locator("header");
    await expect(appBar).toBeVisible({ timeout: 5000 });
    await expect(appBar).toContainText(/HK Invoice Manager/i);
  });

  test("dashboard is the default route after DB creation", async ({ page }) => {
    // After setupApp, we should already be on the dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});
