import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as invoicesDb from '../../../src/database/invoices';
import * as customersDb from '../../../src/database/customers';
let db: SqlJsDatabase;
let SQL: any;
let cid: number;

function e(sql: string, params?: any[]) {
  if (params) { params = params.map((v: any) => (typeof v === 'number' && isNaN(v)) ? 0 : (v === undefined ? null : v)); const stmt = db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); } else db.run(sql);
}

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  runMigrations(db);
  cid = customersDb.createCustomer({ name: 'Client' }, db);
  e("INSERT INTO settings (id,teacher_name,teacher_address,invoice_prefix,invoice_counter,default_payment_terms,default_currency,created_at,updated_at) VALUES (1,'T','A','INV-',1,'30','HKD',datetime('now'),datetime('now'))");
});

describe('createInvoiceWithNumber', () => {
  it('should create invoice with auto-generated number', () => {
    const id = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01', status: 'draft' }, db);
    expect(id).toBeGreaterThan(0);
    const inv = invoicesDb.getInvoiceById(id, db);
    expect(inv!.invoice_number).toMatch(/^INV-2026-/);
  });

  it('should increment counter after each creation', () => {
    const id1 = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
    const id2 = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-02', due_date: '2026-07-02' }, db);
    const inv1 = invoicesDb.getInvoiceById(id1, db);
    const inv2 = invoicesDb.getInvoiceById(id2, db);
    const num1 = parseInt(inv1!.invoice_number.split('-')[2], 10);
    const num2 = parseInt(inv2!.invoice_number.split('-')[2], 10);
    expect(num2).toBe(num1 + 1);
  });

  it('should throw after 10 UNIQUE constraint failures', () => {
    const prefix = 'INV-';
    const year = new Date().getFullYear().toString();
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(4, '0');
      e("INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency, subtotal, discount_percent, discount_amount, total, notes, payment_terms, created_at, updated_at) VALUES (?,?,?,?,'draft','HKD',0,0,0,0,null,null,datetime('now'),datetime('now'))", [prefix + year + '-' + num, '2026-06-01', '2026-07-01', cid]);
    }
    e('UPDATE settings SET invoice_counter = 1 WHERE id = 1');
    expect(() => {
      invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
    }).toThrow('Failed to generate unique invoice number after 10 attempts');
  });
});

describe('getLastInvoiceForCustomer', () => {
  it('should return null when customer has no invoices', () => {
    const result = invoicesDb.getLastInvoiceForCustomer(999, db);
    expect(result).toBeNull();
  });

  it('should return the most recent invoice for the customer', () => {
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-05-01', due_date: '2026-06-01' }, db);
    const lastInv = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
    const result = invoicesDb.getLastInvoiceForCustomer(cid, db);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(lastInv);
  });
});

describe('searchInvoices', () => {
  it('should return all invoices when no filters', () => {
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-15', due_date: '2026-07-15' }, db);
    const results = invoicesDb.searchInvoices({}, db);
    expect(results.length).toBe(2);
  });

  it('should filter by status', () => {
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01', status: 'draft' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-15', due_date: '2026-07-15', status: 'paid' }, db);
    expect(invoicesDb.searchInvoices({ status: 'paid' }, db).length).toBe(1);
    expect(invoicesDb.searchInvoices({ status: 'draft' }, db).length).toBe(1);
    expect(invoicesDb.searchInvoices({ status: 'sent' }, db).length).toBe(0);
  });

  it('should filter by date range', () => {
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-15', due_date: '2026-07-15' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-07-01', due_date: '2026-08-01' }, db);
    const results = invoicesDb.searchInvoices({ dateFrom: '2026-06-10', dateTo: '2026-06-30' }, db);
    expect(results.length).toBe(1);
  });
});

describe('invoice items edge cases', () => {
  let invId: number;
  beforeEach(() => {
    invId = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01' }, db);
  });

  it('should return empty array for invoice with no items', () => {
    const items = invoicesDb.getInvoiceItems(invId, db);
    expect(items).toEqual([]);
  });

  it('should calculate item amount on add', () => {
    const itemId = invoicesDb.addInvoiceItem(invId, { description: 'Lesson', hours: 3, rate: 500 }, db);
    expect(itemId).toBeGreaterThan(0);
    const items = invoicesDb.getInvoiceItems(invId, db);
    expect(items.length).toBe(1);
    expect(items[0].amount).toBe(1500);
  });

  it('should recalculate totals correctly with discount', () => {
    invoicesDb.addInvoiceItem(invId, { description: 'Lesson', hours: 2, rate: 500 }, db);
    invoicesDb.updateInvoice(invId, { discount_percent: 10 }, db);
    invoicesDb.recalculateInvoiceTotals(invId, db);
    const updated = invoicesDb.getInvoiceById(invId, db);
    expect(updated!.subtotal).toBe(1000);
    expect(updated!.discount_amount).toBe(100);
    expect(updated!.total).toBe(900);
  });
});
