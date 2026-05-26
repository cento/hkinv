import { test, expect, _electron as electron } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

function dbPath() {
  return path.join(os.tmpdir(), "e2e-" + Date.now() + ".hkinv");
}

async function launchApp() {
  const app = await electron.launch({ args: [path.join(__dirname, "../..")] });
  const win = await app.firstWindow();
  await win.waitForSelector("text=HK Invoice Manager", { timeout: 20000 });
  return { app, win };
}

async function closeApp(app: any, db: string) {
  await app.close();
  if (fs.existsSync(db)) fs.unlinkSync(db);
}

test.describe("App Launch", () => {
  test("app launches and shows WelcomePage with all buttons", async () => {
    const { app, win } = await launchApp();
    await expect(win.getByRole("button", { name: /Create new archive/i })).toBeVisible();
    await expect(win.getByRole("button", { name: /Open existing archive/i })).toBeVisible();
    await expect(win.getByRole("button", { name: /Import archive/i })).toBeVisible();
    await expect(win.locator("text=HK Invoice Manager")).toBeVisible();
    await app.close();
  });
});

test.describe("IPC: Database Operations", () => {
  test("create DB, save settings, verify settings persist", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    const r = await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    expect(r.success).toBe(true);

    const saveResult = await win.evaluate(async () => (window as any).api.settingsSave({
      teacher_name: "Marco Rossi",
      teacher_address: "Via Roma 1",
      teacher_email: "marco@test.com",
      teacher_phone: "+85212345678",
      br_number: "BR12345",
      invoice_prefix: "INV-",
      invoice_counter: 1,
      default_currency: "HKD",
      default_payment_terms: "30 days",
      bank_details: null,
    }));
    expect(saveResult.success).toBe(true);

    const settings = await win.evaluate(async () => (window as any).api.settingsGet());
    expect(settings.teacher_name).toBe("Marco Rossi");
    expect(settings.invoice_prefix).toBe("INV-");
    expect(settings.invoice_counter).toBe(1);

    await closeApp(app, db);
  });

  test("create customer via IPC", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    const cid = await win.evaluate(async () => (window as any).api.customersCreate({ name: "Test School" }));
    expect(typeof cid).toBe("number");
    expect(cid).toBeGreaterThan(0);
    await closeApp(app, db);
  });

  test("create service type via IPC", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    const svcId = await win.evaluate(async () => (window as any).api.serviceTypesCreate({
      name: "Private Lesson", description_template: "1h lesson", default_rate: 500, default_hours: 1,
    }));
    expect(svcId).toBeGreaterThan(0);
    await closeApp(app, db);
  });

  test("full invoice CRUD: create -> add items -> recalculate -> delete", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    await win.evaluate(async () => (window as any).api.settingsSave({
      teacher_name: "T", teacher_address: "A", teacher_email: "t@t.com",
      invoice_prefix: "INV-", invoice_counter: 1, default_currency: "HKD", default_payment_terms: "30",
    }));
    const cid: number = await win.evaluate(async () => (window as any).api.customersCreate({ name: "Client" }));
    expect(cid).toBeGreaterThan(0);
    const invNum: string = await win.evaluate(async () => (window as any).api.settingsGenerateInvoiceNumber());
    expect(invNum).toContain("INV-");
    const invId: number = await win.evaluate(async (p) => (window as any).api.invoicesCreate({
      customer_id: p.cId, invoice_number: p.invNum, issue_date: "2026-05-27", due_date: "2026-06-26",
      status: "draft", subtotal: 0, discount_percent: 0, discount_amount: 0, total: 0,
    }), { invNum: invNum, cId: cid });
    expect(invId).toBeGreaterThan(0);
    const itemId = await win.evaluate(async (p) => (window as any).api.invoiceItemsAdd(p.invId, {
      description: "Lesson", lesson_date: "2026-05-27", hours: 2, rate: 500, amount: 1000,
    }), { invId: invId });
    expect(itemId).toBeGreaterThan(0);
    await win.evaluate(async (p) => (window as any).api.invoicesRecalculateTotals(p.invId), { invId: invId });
    const full: any = await win.evaluate(async (p) => (window as any).api.invoicesGetById(p.invId), { invId: invId });
    expect(full.total).toBe(1000);
    await win.evaluate(async (p) => (window as any).api.invoicesDelete(p.invId), { invId: invId });
    const check: any = await win.evaluate(async (p) => (window as any).api.invoicesGetById(p.invId), { invId: invId });
    expect(check).toBeNull();
    await closeApp(app, db);
  });

  test("list all invoices returns array", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    await win.evaluate(async () => (window as any).api.settingsSave({
      teacher_name: "T", teacher_address: "A", invoice_prefix: "INV-",
      invoice_counter: 1, default_currency: "HKD", default_payment_terms: "30",
    }));
    const cid = await win.evaluate(async () => (window as any).api.customersCreate({ name: "C" }));
    const invNum2 = await win.evaluate(async () => (window as any).api.settingsGenerateInvoiceNumber());
    await win.evaluate(async (p) => (window as any).api.invoicesCreate({
      customer_id: p.cId, invoice_number: p.invNum, issue_date: "2026-05-27",
      due_date: "2026-06-26", status: "draft",
    }), { invNum: invNum2, cId: cid });
    const list: any[] = await win.evaluate(async () => (window as any).api.invoicesGetAll());
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    await closeApp(app, db);
  });
});

test.describe("IPC: Customer Rates", () => {
  test("set and resolve custom customer rate", async () => {
    const { app, win } = await launchApp();
    const db = dbPath();
    await win.evaluate(async (fp) => (window as any).api.dbCreate(fp), db);
    const cid: number = await win.evaluate(async () => (window as any).api.customersCreate({ name: "C" }));
    const sid: number = await win.evaluate(async () => (window as any).api.serviceTypesCreate({
      name: "Svc", default_rate: 500, default_hours: 1,
    }));
    await win.evaluate(async (p) => (window as any).api.customerRatesSet(p.c, p.s, 400, "Special"), { c: cid, s: sid });
    const resolved: any = await win.evaluate(async (p) => (window as any).api.customerRatesResolve(p.c, p.s), { c: cid, s: sid });
    expect(resolved.rate).toBe(400);
    expect(resolved.description).toBe("Special");
    await closeApp(app, db);
  });
});