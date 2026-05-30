import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { runMigrations } from '../../src/database/migrations';
import * as settingsDb from '../../src/database/settings';
import * as customersDb from '../../src/database/customers';
import * as invoicesDb from '../../src/database/invoices';
import * as serviceTypesDb from '../../src/database/serviceTypes';
import * as customerRatesDb from '../../src/database/customerRates';
import { validateSettings, validateCustomer, validateInvoice, validateInvoiceItem, validateServiceType } from '../../src/utils/validators';

let db, SQL;

function q(sql, params) {
  const stmt = db.prepare(sql); if (params) stmt.bind(params);
  const r = stmt.step() ? stmt.getAsObject() : null; stmt.free(); return r || undefined;
}
function e(sql, params) {
  if (params) { params = params.map(v => (typeof v === 'number' && isNaN(v)) ? 0 : (v === undefined ? null : v)); const stmt = db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); } else db.run(sql);
}

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => { db = new SQL.Database(); db.run('PRAGMA foreign_keys = ON'); runMigrations(db); });

describe('Settings IPC', () => {
  it('should validate and save settings', () => {
    const data = { teacher_name: 'Marco', teacher_address: 'Addr', teacher_email: 'm@t.com', teacher_phone: '+85212345678', br_number: 'BR12345', invoice_prefix: 'INV-', invoice_counter: 1, default_currency: 'HKD', default_payment_terms: '30 days', bank_details: null };
    expect(validateSettings(data).valid).toBe(true);
    settingsDb.saveSettings(data, db);
    expect(settingsDb.getSettings(db).teacher_name).toBe('Marco');
  });
  it('should reject settings missing teacher_name', () => {
    const v = validateSettings({ teacher_name: '', teacher_address: '' });
    expect(v.valid).toBe(false); expect(v.errors.length).toBeGreaterThanOrEqual(2);
  });
  it('should increment counter via direct SQL', () => {
    e("INSERT INTO settings (id,teacher_name,teacher_address,invoice_prefix,invoice_counter,default_payment_terms,default_currency,created_at,updated_at) VALUES (1,'T','A','INV-',1,'30','HKD',datetime('now'),datetime('now'))");
    e('UPDATE settings SET invoice_counter = invoice_counter + 1 WHERE id = 1');
    expect(q('SELECT invoice_counter FROM settings WHERE id = 1').invoice_counter).toBe(2);
  });
});

describe('Customers IPC', () => {
  it('should validate and create customer', () => {
    expect(validateCustomer({ name: 'School' }).valid).toBe(true);
    const id = customersDb.createCustomer({ name: 'Test School' }, db);
    expect(id).toBeGreaterThan(0);
    expect(customersDb.getCustomerById(id, db).name).toBe('Test School');
  });
  it('should reject empty name', () => {
    expect(validateCustomer({ name: '' }).valid).toBe(false);
  });
  it('should update customer', () => {
    const id = customersDb.createCustomer({ name: 'Old' }, db);
    customersDb.updateCustomer(id, { name: 'New' }, db);
    expect(customersDb.getCustomerById(id, db).name).toBe('New');
  });
  it('should delete customer', () => {
    const id = customersDb.createCustomer({ name: 'Del' }, db);
    customersDb.deleteCustomer(id, db);
    expect(customersDb.getCustomerById(id, db)).toBeNull();
  });
  it('should search customers', () => {
    customersDb.createCustomer({ name: 'Alpha' }, db);
    expect(customersDb.searchCustomers('Alpha', db).length).toBe(1);
  });
});

describe('Invoices IPC', () => {
  let cid;
  beforeEach(() => {
    cid = customersDb.createCustomer({ name: 'Client' }, db);
  });
  it('should validate and create invoice', () => {
    const data = { customer_id: cid, invoice_number: 'INV-001', issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft', subtotal: 0, discount_percent: 0, discount_amount: 0, total: 0 };
    expect(validateInvoice(data).valid).toBe(true);
    expect(invoicesDb.createInvoice(data, db)).toBeGreaterThan(0);
  });
  it('should reject invoice without customer', () => {
    expect(validateInvoice({ issue_date: '2026-05-27' }).valid).toBe(false);
  });
  it('should add items and recalculate totals', () => {
    const invId = invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'INV-002', issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft' }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Item', hours: 2, rate: 500, amount: 1000 }, db);
    invoicesDb.recalculateInvoiceTotals(invId, db);
    expect(invoicesDb.getInvoiceById(invId, db).total).toBe(1000);
  });
  it('should search by status', () => {
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'INV-003', issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft' }, db);
    expect(invoicesDb.searchInvoices({ status: 'draft' }, db).length).toBe(1);
  });
  it('should reject createInvoice without invoice_number', () => {
    expect(() => {
      invoicesDb.createInvoice({ customer_id: cid, issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft' }, db);
    }).toThrow('invoice_number is required');
  });
  it('should create invoice with createInvoiceWithNumber without total', () => {
    e("INSERT INTO settings (id,teacher_name,teacher_address,invoice_prefix,invoice_counter,default_payment_terms,default_currency,created_at,updated_at) VALUES (1,'T','A','INV-',1,'30','HKD',datetime('now'),datetime('now'))");
    const invId = invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft' }, db);
    expect(invId).toBeGreaterThan(0);
    const inv = invoicesDb.getInvoiceById(invId, db);
    expect(inv).not.toBeNull();
    expect(inv!.total).toBe(0);
  });
  it('should set paid_date when status changes to paid', () => {
    const invId = invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'INV-PAID-01', issue_date: '2026-05-27', due_date: '2026-06-26', status: 'draft' }, db);
    invoicesDb.updateInvoice(invId, { status: 'paid', paid_date: '2026-06-15' }, db);
    const inv = invoicesDb.getInvoiceById(invId, db);
    expect(inv!.status).toBe('paid');
    expect(inv!.paid_date).toBe('2026-06-15');
  });
  it('should clear paid_date when status changes from paid to draft', () => {
    const invId = invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'INV-PAID-02', issue_date: '2026-05-27', due_date: '2026-06-26', status: 'paid', paid_date: '2026-06-15' }, db);
    invoicesDb.updateInvoice(invId, { status: 'draft', paid_date: null }, db);
    const inv = invoicesDb.getInvoiceById(invId, db);
    expect(inv!.status).toBe('draft');
    expect(inv!.paid_date).toBeNull();
  });
});

describe('Service Types IPC', () => {
  it('should validate and create', () => {
    expect(validateServiceType({ name: 'Lesson', default_rate: 500, default_hours: 1 }).valid).toBe(true);
    expect(serviceTypesDb.createServiceType({ name: 'Lesson', default_rate: 500, default_hours: 1 }, db)).toBeGreaterThan(0);
  });
  it('should reject empty name', () => {
    expect(validateServiceType({ name: '', default_rate: 100, default_hours: 1 }).valid).toBe(false);
  });
});

describe('Invoice Items Validation', () => {
  it('should validate correct item', () => { expect(validateInvoiceItem({ description: 'Lesson', hours: 1, rate: 100 }).valid).toBe(true); });
  it('should reject empty description', () => { expect(validateInvoiceItem({ description: '', hours: 1, rate: 100 }).valid).toBe(false); });
  it('should reject zero hours', () => { expect(validateInvoiceItem({ description: 'L', hours: 0, rate: 100 }).valid).toBe(false); });
  it('should reject negative rate', () => { expect(validateInvoiceItem({ description: 'L', hours: 1, rate: -1 }).valid).toBe(false); });
});

describe('Customer Rates IPC', () => {
  let cid, sid;
  beforeEach(() => {
    cid = customersDb.createCustomer({ name: 'C' }, db);
    sid = serviceTypesDb.createServiceType({ name: 'Svc', default_rate: 500, default_hours: 1 }, db);
  });
  it('should set and get custom rate', () => {
    customerRatesDb.setCustomerRate(cid, sid, 450, 'Special', db);
    expect(customerRatesDb.getCustomerRate(cid, sid, db).custom_rate).toBe(450);
  });
  it('should resolve custom rate', () => {
    customerRatesDb.setCustomerRate(cid, sid, 400, null, db);
    expect(customerRatesDb.resolveRate(cid, sid, db).rate).toBe(400);
  });
  it('should resolve default rate when no custom', () => {
    expect(customerRatesDb.resolveRate(cid, sid, db).rate).toBe(500);
  });
});


