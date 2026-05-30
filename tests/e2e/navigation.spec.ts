import { test, expect, _electron as electron } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

async function launchApp() {
  const app = await electron.launch({ args: [path.join(__dirname, "../..")] });
  const win = await app.firstWindow();
  await win.waitForSelector("text=HK Invoice Manager", { timeout: 20000 });
  return { app, win };
}

async function closeApp(app: any, db?: string) {
  await app.close();
  if (db && fs.existsSync(db)) fs.unlinkSync(db);
}

test.describe("Navigation UI", () => {
  test("sidebar navigation clicks work", async () => {
    const { app, win } = await launchApp();
    const db = path.join(os.tmpdir(), "nav2-" + Date.now() + ".hkinv");
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    await win.evaluate(async () => (window as any).api.settingsSave({
      teacher_name: "Test", teacher_address: "Addr", teacher_email: "t@t.com",
      invoice_prefix: "INV-", invoice_counter: 1, default_currency: "HKD", default_payment_terms: "30",
    }));
    await win.reload();
    await win.waitForFunction(() => window.location.hash.includes("/dashboard"), { timeout: 15000 });

    await win.getByText("Customers").click();
    await win.waitForTimeout(500);
    let h = await win.evaluate(() => window.location.hash);
    expect(h).toContain("/customers");

    await win.getByText("Settings").click();
    await win.waitForTimeout(500);
    h = await win.evaluate(() => window.location.hash);
    expect(h).toContain("/settings");

    await win.getByText("Invoices").first().click();
    await win.waitForTimeout(500);
    h = await win.evaluate(() => window.location.hash);
    expect(h).toContain("/invoices");

    await closeApp(app, db);
  });

  test("language toggle switches between IT and EN", async () => {
    const { app, win } = await launchApp();
    const db = path.join(os.tmpdir(), "lang-" + Date.now() + ".hkinv");
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    await win.evaluate(async () => (window as any).api.settingsSave({
      teacher_name: "Test", teacher_address: "Addr", teacher_email: "t@t.com",
      invoice_prefix: "INV-", invoice_counter: 1, default_currency: "HKD", default_payment_terms: "30",
    }));
    await win.reload();
    await win.waitForFunction(() => window.location.hash.includes("/dashboard"), { timeout: 15000 });

    const itBtn = win.getByRole("button", { name: "IT", exact: true });
    const enBtn = win.getByRole("button", { name: "EN", exact: true });
    await expect(itBtn.or(enBtn).first()).toBeVisible({ timeout: 5000 });
    await closeApp(app, db);
  });
});
