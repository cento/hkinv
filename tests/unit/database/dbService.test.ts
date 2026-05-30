import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';

const { mockDbRef } = vi.hoisted(() => ({ mockDbRef: { current: null as any } }));

vi.mock('../../../src/database/connection', () => ({
  getDatabase: () => mockDbRef.current,
  saveDatabase: vi.fn(),
  notifySave: vi.fn(),
  isDatabaseOpen: () => mockDbRef.current !== null,
  closeDatabase: vi.fn(),
  createDatabase: vi.fn(),
  openDatabase: vi.fn(),
  importDatabase: vi.fn(),
  getDbPath: () => 'test',
  onSave: vi.fn(),
}));

vi.mock('../../../src/database/backup', () => ({
  triggerBackup: vi.fn(() => Promise.resolve(true)),
  stopBackupTimer: vi.fn(),
  startBackupTimer: vi.fn(),
}));

vi.mock('../../../src/database/opfs', () => ({
  readOPFSFile: vi.fn(() => Promise.resolve(null)),
  writeOPFSFile: vi.fn(() => Promise.resolve()),
  deleteOPFSFile: vi.fn(() => Promise.resolve()),
  hasOPFSFile: vi.fn(() => Promise.resolve(false)),
  hasExistingDB: vi.fn(() => Promise.resolve(false)),
  DB_FILENAME: 'db.hkinv',
}));

vi.mock('../../../src/database/fsa', () => ({
  supportsFSA: () => false,
  openHKINVFile: vi.fn(() => Promise.resolve(null)),
  saveHKINVFile: vi.fn(() => Promise.resolve(null)),
  configureBackupLocation: vi.fn(() => Promise.resolve(false)),
  downloadBlob: vi.fn(),
}));

import * as settingsDb from '../../../src/database/settings';
import * as customersDb from '../../../src/database/customers';
import * as invoicesDb from '../../../src/database/invoices';
import * as serviceTypesDb from '../../../src/database/serviceTypes';
import * as customerRatesDb from '../../../src/database/customerRates';

let SQL: any;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  runMigrations(db);
  mockDbRef.current = db;
});

describe('DB module integration (via mock connection)', () => {
  it('settings CRUD', () => {
    expect(settingsDb.getSettings()).toBeNull();
    expect(settingsDb.hasSettings()).toBe(false);
    settingsDb.saveSettings({
      teacher_name: 'T', teacher_address: 'A',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30', default_currency: 'HKD', bank_details: null,
    });
    expect(settingsDb.hasSettings()).toBe(true);
    const s = settingsDb.getSettings();
    expect(s).not.toBeNull();
    expect(s!.teacher_name).toBe('T');
    const c = settingsDb.incrementCounter();
    expect(c).toBe(2);
  });

  it('customers CRUD + search', () => {
    expect(customersDb.getAllCustomers()).toEqual([]);
    const id = customersDb.createCustomer({ name: 'School X', email: 'x@school.com' });
    expect(id).toBeGreaterThan(0);
    let c = customersDb.getCustomerById(id);
    expect(c!.name).toBe('School X');
    customersDb.updateCustomer(id, { name: 'Updated' });
    c = customersDb.getCustomerById(id);
    expect(c!.name).toBe('Updated');
    const results = customersDb.searchCustomers('School');
    expect(results).toHaveLength(1);
    customersDb.deleteCustomer(id);
    expect(customersDb.getCustomerById(id)).toBeNull();
  });

  it('invoices with auto-numbering', () => {
    settingsDb.saveSettings({
      teacher_name: 'T', teacher_address: 'A',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30', default_currency: 'HKD', bank_details: null,
    });
    const cid = customersDb.createCustomer({ name: 'Client' });
    expect(invoicesDb.getAllInvoices()).toEqual([]);
    const invId = invoicesDb.createInvoiceWithNumber({
      customer_id: cid, issue_date: '2026-06-01', due_date: '2026-07-01', status: 'draft',
    });
    expect(invId).toBeGreaterThan(0);
    const inv = invoicesDb.getInvoiceById(invId);
    expect(inv!.invoice_number).toMatch(/^INV-2026-/);
  });

  it('invoices with custom number', () => {
    const cid = customersDb.createCustomer({ name: 'Client' });
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'CUSTOM-001',
      issue_date: '2026-06-01', due_date: '2026-07-01', status: 'draft',
    });
    const inv = invoicesDb.getInvoiceById(invId);
    expect(inv!.invoice_number).toBe('CUSTOM-001');
  });

  it('invoice getByNumber', () => {
    const cid = customersDb.createCustomer({ name: 'Client' });
    invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'FIND-001',
      issue_date: '2026-06-01', due_date: '2026-07-01',
    });
    const found = invoicesDb.getInvoiceByNumber('FIND-001');
    expect(found).not.toBeNull();
  });

  it('invoice items and recalculation', () => {
    const cid = customersDb.createCustomer({ name: 'Client' });
    const invId = invoicesDb.createInvoice({
      customer_id: cid, invoice_number: 'ITEMS-001',
      issue_date: '2026-06-01', due_date: '2026-07-01',
    });
    invoicesDb.addInvoiceItem(invId, { description: 'Lesson', hours: 3, rate: 500 });
    invoicesDb.updateInvoice(invId, { discount_percent: 10 });
    invoicesDb.recalculateInvoiceTotals(invId);
    const inv = invoicesDb.getInvoiceById(invId);
    expect(inv!.subtotal).toBe(1500);
    expect(inv!.discount_amount).toBe(150);
    expect(inv!.total).toBe(1350);
    const items = invoicesDb.getInvoiceItems(invId);
    expect(items).toHaveLength(1);
  });

  it('invoice search by status and date', () => {
    const cid = customersDb.createCustomer({ name: 'Client' });
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'A-001', issue_date: '2026-06-01', due_date: '2026-07-01', status: 'draft' });
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'A-002', issue_date: '2026-06-15', due_date: '2026-07-15', status: 'sent' });
    expect(invoicesDb.searchInvoices({ status: 'draft' }).length).toBe(1);
    expect(invoicesDb.searchInvoices({ dateFrom: '2026-06-10' }).length).toBe(1);
  });

  it('getLastInvoice and getLastInvoiceForCustomer', () => {
    const cid = customersDb.createCustomer({ name: 'Client' });
    expect(invoicesDb.getLastInvoice()).toBeNull();
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'L-001', issue_date: '2026-06-01', due_date: '2026-07-01' });
    const last = invoicesDb.getLastInvoice();
    expect(last).not.toBeNull();
    expect(last!.invoice_number).toBe('L-001');
    const lastCust = invoicesDb.getLastInvoiceForCustomer(cid);
    expect(lastCust).not.toBeNull();
  });

  it('generateInvoiceNumber', () => {
    settingsDb.saveSettings({
      teacher_name: 'T', teacher_address: 'A',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 42,
      default_payment_terms: '30', default_currency: 'HKD', bank_details: null,
    });
    const num = invoicesDb.generateInvoiceNumber();
    expect(num).toMatch(/^INV-2026-0042$/);
  });

  it('service types CRUD + isInUse', () => {
    const id = serviceTypesDb.createServiceType({ name: 'Lesson', default_rate: 500, default_hours: 1 });
    expect(serviceTypesDb.getServiceTypeById(id)!.name).toBe('Lesson');
    serviceTypesDb.updateServiceType(id, { default_rate: 550 });
    expect(serviceTypesDb.getServiceTypeById(id)!.default_rate).toBe(550);
    expect(serviceTypesDb.isServiceTypeInUse(id)).toBe(false);
    const cid = customersDb.createCustomer({ name: 'C' });
    customerRatesDb.setCustomerRate(cid, id, 450);
    expect(serviceTypesDb.isServiceTypeInUse(id)).toBe(true);
    serviceTypesDb.deleteServiceType(id);
    expect(serviceTypesDb.getServiceTypeById(id)).toBeNull();
  });

  it('customer rates + resolve', () => {
    const cid = customersDb.createCustomer({ name: 'C' });
    const sid = serviceTypesDb.createServiceType({ name: 'Svc', default_rate: 500, default_hours: 1 });
    customerRatesDb.setCustomerRate(cid, sid, 400, 'Special');
    const r = customerRatesDb.getCustomerRate(cid, sid);
    expect(r!.custom_rate).toBe(400);
    expect(r!.custom_description).toBe('Special');
    const rates = customerRatesDb.getAllRatesForCustomer(cid);
    expect(rates).toHaveLength(1);
    expect(rates[0].service_name).toBe('Svc');
    const resolved = customerRatesDb.resolveRate(cid, sid);
    expect(resolved.rate).toBe(400);
    customerRatesDb.deleteCustomerRate(r!.id);
    expect(customerRatesDb.getCustomerRate(cid, sid)).toBeNull();
    const defaultResolved = customerRatesDb.resolveRate(cid, sid);
    expect(defaultResolved.rate).toBe(500);
  });

  it('search invoices with all filters', () => {
    const cid = customersDb.createCustomer({ name: 'C' });
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'F-001', issue_date: '2026-06-01', due_date: '2026-07-01', total: 1000 });
    invoicesDb.createInvoice({ customer_id: cid, invoice_number: 'F-002', issue_date: '2026-06-15', due_date: '2026-07-15', total: 2000 });
    expect(invoicesDb.searchInvoices({ minAmount: 1500 }).length).toBe(1);
    expect(invoicesDb.searchInvoices({ maxAmount: 1500 }).length).toBe(1);
    expect(invoicesDb.searchInvoices({ invoiceNumberSearch: '002' }).length).toBe(1);
  });
});
