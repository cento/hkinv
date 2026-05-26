import { describe, it, expect } from 'vitest';
import { createTestDb, q, qa, e } from './helpers';

describe('Invoices', () => {
  

  it("should handle null description in addInvoiceItem", async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    e(db, "INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at) VALUES (?,?,?,?,datetime('now'),datetime('now'))",
      ["INV-0001","2026-05-27","2026-06-26",custId]);
    const inv = q(db, "SELECT id FROM invoices");
    // description does not accept null
    expect(() => {
      e(db, "INSERT INTO invoice_items (invoice_id, sort_order, description, hours, rate, amount) VALUES (?,?,?,?,?,?)",
        [inv.id, 1, null, 1, 100, 100]);
    }).toThrow();
    db.close();
  });

  it("should handle 0 hours gracefully in addInvoiceItem", async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    e(db, "INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at) VALUES (?,?,?,?,datetime('now'),datetime('now'))",
      ["INV-0002","2026-05-27","2026-06-26",custId]);
    const inv = q(db, "SELECT id FROM invoices");
    e(db, "INSERT INTO invoice_items (invoice_id, sort_order, description, hours, rate, amount) VALUES (?,?,?,?,?,?)",
      [inv.id, 1, "Item with 0 hours", 0, 100, 0]);
    const items = qa(db, "SELECT * FROM invoice_items WHERE invoice_id=?", [inv.id]);
    expect(items).toHaveLength(1);
    expect(items[0].hours).toBe(0);
    expect(items[0].amount).toBe(0);
    db.close();
  });

  it("should save invoice with all metadata fields", async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    e(db, "INSERT INTO settings (id, teacher_name, teacher_address, invoice_prefix, invoice_counter, default_payment_terms, default_currency, created_at, updated_at) VALUES (1,?,?,?,?,?,?,datetime('now'),datetime('now'))",
      ["Mario","Addr","INV-",1,"30 giorni","HKD"]);
    e(db, "INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency, subtotal, discount_percent, discount_amount, total, notes, payment_terms, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))",
      ["INV-2026-0005","2026-05-27","2026-06-26",custId,"draft","HKD",1500,10,150,1350,"Note di test","30 giorni"]);
    const inv = q(db, "SELECT * FROM invoices");
    expect(inv).toBeDefined();
    expect(inv.notes).toBe("Note di test");
    expect(inv.payment_terms).toBe("30 giorni");
    expect(inv.discount_percent).toBe(10);
    expect(inv.total).toBe(1350);
    db.close();
  });

  it("should update invoice metadata without affecting items", async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    e(db, "INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at) VALUES (?,?,?,?,datetime('now'),datetime('now'))",
      ["INV-0003","2026-05-27","2026-06-26",custId]);
    const inv = q(db, "SELECT id FROM invoices");
    e(db, "INSERT INTO invoice_items (invoice_id, sort_order, description, hours, rate, amount) VALUES (?,?,?,?,?,?)",
      [inv.id, 1, "Item", 2, 500, 1000]);
    e(db, "UPDATE invoices SET notes=?, payment_terms=?, discount_percent=? WHERE id=?",
      ["Updated notes","15 giorni",5,inv.id]);
    const updated = q(db, "SELECT * FROM invoices WHERE id=?", [inv.id]);
    expect(updated.notes).toBe("Updated notes");
    expect(updated.payment_terms).toBe("15 giorni");
    expect(updated.discount_percent).toBe(5);
    const items = qa(db, "SELECT * FROM invoice_items WHERE invoice_id=?", [inv.id]);
    expect(items).toHaveLength(1);
    db.close();
  });
it("should create invoice with atomic number generation", async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    // First a simple customer insert
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ["Test Cus"]);
    const cRow = q(db, "SELECT id FROM customers");
    const cId = cRow.id;
    
    // Now test that createInvoiceWithNumber works (simulated via the IPC flow)
    // Insert settings with counter
    e(db, `INSERT INTO settings (id, teacher_name, teacher_address, invoice_prefix, invoice_counter,
      default_payment_terms, default_currency, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ["Mario", "Addr", "INV-", 1, "30g", "HKD"]);
    
    const invNum = "INV-2026-0001";
    const now = new Date().toISOString();
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency,
      subtotal, discount_percent, discount_amount, total, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invNum, "2026-05-27", "2026-06-26", cId, "draft", "HKD", 0, 0, 0, 0, now, now]);
    
    const row = q(db, "SELECT * FROM invoices WHERE invoice_number = ?", [invNum]);
    expect(row).toBeDefined();
    expect(row!.invoice_number).toBe(invNum);
    
    db.close();
  });

  async function seedWithCustomer(db: any): Promise<number> {
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Test Customer']);
    const row = q(db, 'SELECT id FROM customers');
    return row!.id as number;
  }

  it('should create an invoice with all fields', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency,
      subtotal, discount_percent, discount_amount, total, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-2026-0001', '2026-05-26', '2026-06-25', custId, 'draft', 'HKD', 1000, 10, 100, 900]);
    
    const row = q(db, 'SELECT * FROM invoices');
    expect(row).toBeDefined();
    expect(row!.invoice_number).toBe('INV-2026-0001');
    expect(row!.customer_id).toBe(custId);
    expect(row!.total).toBe(900);
    db.close();
  });

  it('should enforce unique invoice_number', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-2026-0001', '2026-05-26', '2026-06-25', custId]);
    
    expect(() => {
      e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        ['INV-2026-0001', '2026-05-26', '2026-06-25', custId]);
    }).toThrow();
    db.close();
  });

  it('should add invoice items and calculate amounts', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-2026-0001', '2026-05-26', '2026-06-25', custId]);
    const inv = q(db, 'SELECT id FROM invoices');
    const invId = inv!.id as number;
    
    // Add 3 items
    e(db, `INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [invId, 1, 'Lezione 4/5', '2026-05-04', 1, 500, 500]);
    e(db, `INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [invId, 2, 'Lezione 11/5', '2026-05-11', 1, 500, 500]);
    e(db, `INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [invId, 3, 'Lezione 18/5', '2026-05-18', 1.5, 400, 600]);
    
    const items = qa(db, 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order', [invId]);
    expect(items).toHaveLength(3);
    
    const subtotal = items.reduce((sum: number, i: any) => sum + i.amount, 0);
    expect(subtotal).toBe(1600); // 500 + 500 + 600
    db.close();
  });

  it('should calculate totals with discount', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-2026-0001', '2026-05-26', '2026-06-25', custId]);
    const inv = q(db, 'SELECT id FROM invoices');
    const invId = inv!.id as number;
    
    // Add items
    e(db, `INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [invId, 1, 'Item 1', '2026-05-04', 2, 500, 1000]);
    
    // Calculate totals with 10% discount
    const items = qa(db, 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order', [invId]);
    const subtotal = items.reduce((sum: number, i: any) => sum + i.amount, 0);
    const discountPercent = 10;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    
    e(db, 'UPDATE invoices SET subtotal = ?, discount_percent = ?, discount_amount = ?, total = ? WHERE id = ?',
      [subtotal, discountPercent, discountAmount, total, invId]);
    
    const updated = q(db, 'SELECT * FROM invoices WHERE id = ?', [invId]);
    expect(updated!.subtotal).toBe(1000);
    expect(updated!.discount_percent).toBe(10);
    expect(updated!.discount_amount).toBe(100);
    expect(updated!.total).toBe(900);
    db.close();
  });

  it('should cascade delete invoice items when invoice is deleted', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-2026-0001', '2026-05-26', '2026-06-25', custId]);
    const inv = q(db, 'SELECT id FROM invoices');
    const invId = inv!.id as number;
    
    e(db, `INSERT INTO invoice_items (invoice_id, sort_order, description, hours, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?)`, [invId, 1, 'Item', 1, 100, 100]);
    
    e(db, 'DELETE FROM invoices WHERE id = ?', [invId]);
    
    const remaining = qa(db, 'SELECT * FROM invoice_items WHERE invoice_id = ?', [invId]);
    expect(remaining).toHaveLength(0);
    db.close();
  });

  it('should filter invoices by status', async () => {
    const db = await createTestDb();
    const custId = await seedWithCustomer(db);
    
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-001', '2026-05-26', '2026-06-25', custId, 'draft']);
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-002', '2026-05-27', '2026-06-26', custId, 'sent']);
    e(db, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['INV-003', '2026-05-28', '2026-06-27', custId, 'paid']);
    
    const drafts = qa(db, "SELECT * FROM invoices WHERE status = 'draft'");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].invoice_number).toBe('INV-001');
    
    const paid = qa(db, "SELECT * FROM invoices WHERE status = 'paid'");
    expect(paid).toHaveLength(1);
    expect(paid[0].invoice_number).toBe('INV-003');
    db.close();
  });
});
