import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as invoicesDb from '../../../src/database/invoices';
import * as customersDb from '../../../src/database/customers';
import * as settingsDb from '../../../src/database/settings';

let db: SqlJsDatabase;
let SQL: any;
let cid: number;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  runMigrations(db);
  cid = customersDb.createCustomer({ name: 'Test Customer' }, db);
});

describe('Invoices', () => {
  it('should create an invoice with all fields', () => {
    const id = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0001',
      issue_date: '2026-05-26', due_date: '2026-06-25',
      status: 'draft', currency: 'HKD', subtotal: 1000,
      discount_percent: 10, discount_amount: 100, total: 900,
    }, db);
    const inv = invoicesDb.getInvoiceById(id, db);
    expect(inv).not.toBeNull();
    expect(inv!.invoice_number).toBe('INV-2026-0001');
    expect(inv!.customer_id).toBe(cid);
    expect(inv!.total).toBe(900);
  });

  it('should enforce unique invoice_number', () => {
    invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0001',
      issue_date: '2026-05-26', due_date: '2026-06-25',
    }, db);
    expect(() => {
      invoicesDb.createInvoice({
        customer_id: cid, invoice_number: 'INV-2026-0001',
        issue_date: '2026-05-26', due_date: '2026-06-25',
      }, db);
    }).toThrow();
  });

  it('should handle null description in addInvoiceItem', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-0001',
      issue_date: '2026-05-27', due_date: '2026-06-26',
    }, db);
    expect(() => {
      invoicesDb.addInvoiceItem(invId, { description: '', hours: 1, rate: 100 }, db);
    }).not.toThrow();
  });

  it('should handle 0 hours gracefully in addInvoiceItem', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-0002',
      issue_date: '2026-05-27', due_date: '2026-06-26',
    }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Item with 0 hours', hours: 0, rate: 100 }, db);
    const items = invoicesDb.getInvoiceItems(invId, db);
    expect(items).toHaveLength(1);
    expect(items[0].hours).toBe(0);
    expect(items[0].amount).toBe(0);
  });

  it('should save invoice with all metadata fields', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30 giorni', default_currency: 'HKD', bank_details: null,
    } as any, db);
    const id = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0005',
      issue_date: '2026-05-27', due_date: '2026-06-26',
      status: 'draft', currency: 'HKD', subtotal: 1500,
      discount_percent: 10, discount_amount: 150, total: 1350,
      notes: 'Note di test', payment_terms: '30 giorni',
    }, db);
    const inv = invoicesDb.getInvoiceById(id, db);
    expect(inv).toBeDefined();
    expect(inv!.notes).toBe('Note di test');
    expect(inv!.payment_terms).toBe('30 giorni');
    expect(inv!.discount_percent).toBe(10);
    expect(inv!.total).toBe(1350);
  });

  it('should update invoice metadata without affecting items', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-0003',
      issue_date: '2026-05-27', due_date: '2026-06-26',
    }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Item', hours: 2, rate: 500 }, db);
    invoicesDb.updateInvoice(invId, { notes: 'Updated notes', payment_terms: '15 giorni', discount_percent: 5 }, db);
    const updated = invoicesDb.getInvoiceById(invId, db);
    expect(updated!.notes).toBe('Updated notes');
    expect(updated!.payment_terms).toBe('15 giorni');
    expect(updated!.discount_percent).toBe(5);
    const items = invoicesDb.getInvoiceItems(invId, db);
    expect(items).toHaveLength(1);
  });

  it('should create invoice with atomic number generation', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    } as any, db);
    const id = invoicesDb.createInvoiceWithNumber({
      customer_id: cid, issue_date: '2026-05-27', due_date: '2026-06-26',
    }, db);
    const inv = invoicesDb.getInvoiceById(id, db);
    expect(inv).toBeDefined();
    expect(inv!.invoice_number).toMatch(/^INV-2026-/);
  });

  it('should add invoice items and calculate amounts', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0001',
      issue_date: '2026-05-26', due_date: '2026-06-25',
    }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Lezione 4/5', lesson_date: '2026-05-04', hours: 1, rate: 500 }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Lezione 11/5', lesson_date: '2026-05-11', hours: 1, rate: 500 }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Lezione 18/5', lesson_date: '2026-05-18', hours: 1.5, rate: 400 }, db);
    const items = invoicesDb.getInvoiceItems(invId, db);
    expect(items).toHaveLength(3);
    const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
    expect(subtotal).toBe(1600);
  });

  it('should calculate totals with discount', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0001',
      issue_date: '2026-05-26', due_date: '2026-06-25',
    }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Item 1', lesson_date: '2026-05-04', hours: 2, rate: 500 }, db);
    invoicesDb.updateInvoice(invId, { discount_percent: 10 }, db);
    invoicesDb.recalculateInvoiceTotals(invId, db);
    const inv = invoicesDb.getInvoiceById(invId, db);
    expect(inv!.subtotal).toBe(1000);
    expect(inv!.discount_amount).toBe(100);
    expect(inv!.total).toBe(900);
  });

  it('should cascade delete invoice items when invoice is deleted', () => {
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'INV-2026-0001',
      issue_date: '2026-05-26', due_date: '2026-06-25',
    }, db);
    invoicesDb.addInvoiceItem(invId, { description: 'Item', hours: 1, rate: 100 }, db);
    invoicesDb.deleteInvoice(invId, db);
    expect(invoicesDb.getInvoiceItems(invId, db)).toHaveLength(0);
  });

  it('should filter invoices by status', () => {
    settingsDb.saveSettings({
      teacher_name: 'M', teacher_address: 'A',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    } as any, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-05-26', due_date: '2026-06-25', status: 'draft' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-05-27', due_date: '2026-06-26', status: 'sent' }, db);
    invoicesDb.createInvoiceWithNumber({ customer_id: cid, issue_date: '2026-05-28', due_date: '2026-06-27', status: 'paid' }, db);
    expect(invoicesDb.searchInvoices({ status: 'draft' }, db)).toHaveLength(1);
    expect(invoicesDb.searchInvoices({ status: 'paid' }, db)).toHaveLength(1);
  });
});
