import { test, expect } from "@playwright/test";
import { setupApp } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.waitForTimeout(500);
  });

  test("should load settings page", async ({ page }) => {
    await page.getByText("Settings").first().click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("main").getByRole("heading").first(),
    ).toContainText(/Settings|Impostazioni/i);
  });

  test("should show main form fields on settings page", async ({ page }) => {
    await page.getByText("Settings").first().click();
    await page.waitForTimeout(500);
    // The teacher name field has label "Full name"
    const nameField = page.getByLabel("Full name");
    await expect(nameField).toBeVisible({ timeout: 3000 });

    // The address field
    const addressField = page.getByLabel("Address");
    await expect(addressField).toBeVisible({ timeout: 3000 });

    // The email field
    const emailField = page.getByLabel("Email");
    await expect(emailField).toBeVisible({ timeout: 3000 });
  });

  test("should fill and save teacher settings", async ({ page }) => {
    await page.getByText("Settings").first().click();
    await page.waitForTimeout(500);

    // Fill the form
    await page.getByLabel("Full name").fill("Marco Rossi");
    await page
      .getByLabel("Address")
      .fill("123 Queen's Road Central, Hong Kong");
    await page.getByLabel("Email").fill("marco@example.hk");

    // Verify the Save button is enabled (requires name + address)
    const saveBtn = page.getByRole("button", { name: "Save" }).first();
    await expect(saveBtn).toBeEnabled();

    // Save
    await saveBtn.click();
    await page.waitForTimeout(500);

    // After saving, field values should still be visible on the page
    await expect(page.getByLabel("Full name")).toHaveValue("Marco Rossi");
  });
});
