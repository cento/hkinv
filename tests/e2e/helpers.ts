import { Page, expect } from "@playwright/test";

/**
 * Helper to set up a fresh app state: create a database and fill in teacher settings.
 * Must be called at the start of each test file.
 */
export async function setupApp(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // WelcomePage: click "Create new archive" to start fresh
  // Note: OPFS is fresh per browser context, so there's no existing DB
  const createBtn = page.getByRole("button", {
    name: /Create new|Crea nuovo/i,
  });
  await createBtn.waitFor({ state: "visible", timeout: 10000 });
  await createBtn.click();

  // Wait for DB creation and navigation
  await page.waitForTimeout(2000);

  try {
    await page.waitForURL(/dashboard|settings/, { timeout: 8000 });
  } catch {
    console.log("Navigation after create was slow, continuing...");
  }
  await page.waitForTimeout(1000);

  // Check if redirected to dashboard (settings already done)
  const dashboardVisible = await page
    .getByText(/Dashboard|Pannello/i)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!dashboardVisible) {
    // Either on Settings page or OnboardingWizard
    await fillTeacherSettings(page);
  }
}

/**
 * Fill in the required teacher profile fields.
 */
export async function fillTeacherSettings(page: Page) {
  await page.waitForTimeout(500);

  // Check if OnboardingWizard is open
  const wizardDialog = page.getByRole("dialog");
  const wizardVisible = await wizardDialog
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (wizardVisible) {
    // Fill onboarding wizard
    await wizardDialog
      .getByLabel(/Name|Nome/i)
      .first()
      .waitFor({
        state: "visible",
        timeout: 5000,
      });
    await wizardDialog
      .getByLabel(/Name|Nome/i)
      .first()
      .fill("Marco Rossi");
    await wizardDialog
      .getByLabel(/Address|Indirizzo/i)
      .first()
      .fill("123 Queen's Road Central, Hong Kong");
    await wizardDialog.getByLabel(/Email/i).first().fill("marco@example.hk");
    await wizardDialog
      .getByLabel(/Phone|Telefono/i)
      .first()
      .fill("+852 1234 5678");

    // Click the save/next button
    await wizardDialog
      .getByRole("button", { name: /Save|Salva|Next|Avanti/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // If there are more steps, complete them
    const stillVisible = await wizardDialog
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (stillVisible) {
      await wizardDialog
        .getByRole("button", {
          name: /Save|Salva|Next|Avanti/i,
        })
        .first()
        .click();
      await page.waitForTimeout(500);
    }
  } else {
    // Try the Settings page directly
    const nameField = page.getByLabel(/Name|Nome/i).first();
    const nameVisible = await nameField
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (nameVisible) {
      await nameField.fill("Marco Rossi");
      await page
        .getByLabel(/Address|Indirizzo/i)
        .first()
        .fill("123 Queen's Road Central, Hong Kong");
      await page.getByLabel(/Email/i).first().fill("marco@example.hk");
      await page
        .getByLabel(/Phone|Telefono/i)
        .first()
        .fill("+852 1234 5678");

      // Save
      await page
        .getByRole("button", { name: /Save|Salva/i })
        .first()
        .click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Navigate to a specific page via sidebar.
 */
export async function navigateTo(page: Page, pageName: string) {
  // Wait for sidebar to be ready
  await page.waitForTimeout(500);

  // On mobile, open the hamburger menu first
  const menuBtn = page.getByRole("button", { name: /menu|open/i }).first();
  const menuVisible = await menuBtn.isVisible().catch(() => false);
  if (menuVisible) {
    await menuBtn.click();
    await page.waitForTimeout(300);
  }

  // Click the nav item in the sidebar
  const navLink = page.getByText(pageName).first();
  await navLink.click();
  await page.waitForTimeout(500);
}

/**
 * Create a customer for testing purposes.
 */
export async function createTestCustomer(
  page: Page,
  name = "Scuola Italiana HK",
) {
  await navigateTo(page, "Customers");
  await page.waitForTimeout(500);

  const addBtn = page.getByRole("button", { name: /Add|Aggiungi/i }).first();
  await addBtn.waitFor({ state: "visible", timeout: 5000 });
  await addBtn.click();

  // Wait for dialog
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  // Fill name
  await dialog
    .getByLabel(/Name|Nome/i)
    .first()
    .fill(name);

  // Fill address if present
  const addressField = dialog.getByLabel(/Address|Indirizzo/i);
  if (await addressField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await addressField.fill("1/F, 123 Nathan Road, Kowloon");
  }

  // Fill email if present
  const emailField = dialog.getByLabel(/Email/i);
  if (await emailField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emailField.fill("info@test.hk");
  }

  // Fill phone if present
  const phoneField = dialog.getByLabel(/Phone|Telefono/i);
  if (await phoneField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await phoneField.fill("+852 9876 5432");
  }

  // Click save in dialog
  await dialog.getByRole("button", { name: /Save|Salva/i }).click();
  await page.waitForTimeout(500);
}

/**
 * Create a service type for testing purposes.
 */
export async function createTestServiceType(
  page: Page,
  name = "Lezione individuale",
) {
  await navigateTo(page, "Service Types");
  await page.waitForTimeout(500);

  const addBtn = page.getByRole("button", { name: /Add|Aggiungi/i }).first();
  await addBtn.waitFor({ state: "visible", timeout: 5000 });
  await addBtn.click();

  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  await dialog
    .getByLabel(/Name|Nome/i)
    .first()
    .fill(name);

  // Fill rate and hours if present
  const rateField = dialog.getByLabel(/Rate|Tariffa|Prezzo/i);
  if (await rateField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await rateField.fill("250");
  }

  const hoursField = dialog.getByLabel(/Hours|Ore/i);
  if (await hoursField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await hoursField.fill("1");
  }

  await dialog.getByRole("button", { name: /Save|Salva/i }).click();
  await page.waitForTimeout(500);
}

/**
 * Assert a toast/snackbar appears with expected text.
 */
export async function expectToast(page: Page, messagePattern: RegExp) {
  const alert = page.getByRole("alert");
  await alert.waitFor({ state: "visible", timeout: 5000 });
  await expect(alert).toContainText(messagePattern);
}
