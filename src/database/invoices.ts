import { Database as SqlJsDatabase, Statement } from 'sql.js';
import { getDatabase, saveDatabase } from './connection';
import { incrementCounter, getSettings } from './settings';

export interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  customer_id: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  currency: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  payment_terms: string | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInput {
  issue_date: string;
  due_date: string;
  customer_id: number;
  status?: 'draft' | 'sent' | 'paid' | 'cancelled';
  currency?: string;
  subtotal?: number;
  discount_percent?: number;
  discount_amount?: number;
  total?: number;
  notes?: string | null;
  payment_terms?: string | null;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  sort_order: number;
  description: string;
  lesson_date: string | null;
  hours: number;
  rate: number;
  amount: number;
}

export interface InvoiceItemInput {
  description: string;
  lesson_date?: string | null;
  hours: number;
  rate: number;
}

export interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
}

export interface InvoiceFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: number;
  status?: string;
  invoiceNumberSearch?: string;
  minAmount?: number;
  maxAmount?: number;
}

const ALLOWED_INVOICE_COLUMNS = [
  'invoice_number', 'issue_date', 'due_date', 'customer_id', 'status',
  'currency', 'subtotal', 'discount_percent', 'discount_amount', 'total',
  'notes', 'payment_terms', 'paid_date',
];

type SqlParam = number | string | null;

function sanitizeValue(v: unknown): SqlParam {
  if (typeof v === 'number' && isNaN(v)) return 0;
  if (v === undefined) return null;
  return v as SqlParam;
}

function q(db: SqlJsDatabase, sql: string, params?: SqlParam[]): Record<string, unknown> | undefined {
  let stmt: Statement | null = null;
  try {
    stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const r = stmt.step() ? stmt.getAsObject() : null;
    return r || undefined;
  } finally {
    if (stmt) stmt.free();
  }
}
function qa(db: SqlJsDatabase, sql: string, params?: SqlParam[]): Record<string, unknown>[] {
  let stmt: Statement | null = null;
  try {
    stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const r: Record<string, unknown>[] = [];
    while (stmt.step()) r.push(stmt.getAsObject());
    return r;
  } finally {
    if (stmt) stmt.free();
  }
}
function e(db: SqlJsDatabase, sql: string, params?: SqlParam[]): void {
  if (params) {
    const sanitized = params.map(v => sanitizeValue(v));
    let stmt: Statement | null = null;
    try {
      stmt = db.prepare(sql);
      stmt.bind(sanitized);
      stmt.step();
    } finally {
      if (stmt) stmt.free();
    }
  } else {
    db.run(sql);
  }
}

function getLastInsertId(db: SqlJsDatabase, table: string): number {
  const row = q(db, `SELECT id FROM ${table} ORDER BY id DESC LIMIT 1`);
  return row ? (row.id as number) : 0;
}

export function createInvoice(data: InvoiceInput & { invoice_number?: string }, _db?: SqlJsDatabase): number {
  if (!data.invoice_number) {
    throw new Error('invoice_number is required');
  }
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  e(conn, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency,
    subtotal, discount_percent, discount_amount, total, notes, payment_terms, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.invoice_number ?? '', data.issue_date, data.due_date, data.customer_id,
     data.status ?? 'draft', data.currency ?? 'HKD', data.subtotal ?? 0,
     data.discount_percent ?? 0, data.discount_amount ?? 0, data.total ?? 0,
     data.notes ?? null, data.payment_terms ?? null, now, now]);
  const id = getLastInsertId(conn, 'invoices');
  saveDatabase();
  return id;
}

export function getAllInvoices(_db?: SqlJsDatabase): InvoiceWithCustomer[] {
  const conn = _db || getDatabase();
  return qa(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC`) as unknown as InvoiceWithCustomer[];
}

export function getInvoiceById(id: number, _db?: SqlJsDatabase): InvoiceWithCustomer | null {
  const conn = _db || getDatabase();
  const row = q(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`, [id]);
  return (row as unknown as InvoiceWithCustomer) || null;
}

export function getInvoiceByNumber(number: string, _db?: SqlJsDatabase): InvoiceWithCustomer | null {
  const conn = _db || getDatabase();
  const row = q(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id WHERE i.invoice_number = ?`, [number]);
  return (row as unknown as InvoiceWithCustomer) || null;
}

export function updateInvoice(id: number, data: Partial<InvoiceInput>, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = []; const values: SqlParam[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && ALLOWED_INVOICE_COLUMNS.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value as SqlParam);
    }
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); values.push(now, id);
  e(conn, `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteInvoice(id: number, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  e(conn, 'DELETE FROM invoices WHERE id = ?', [id]);
  saveDatabase();
}

export function searchInvoices(filters: InvoiceFilters, _db?: SqlJsDatabase): InvoiceWithCustomer[] {
  const conn = _db || getDatabase();
  const conditions: string[] = []; const values: SqlParam[] = [];
  if (filters.dateFrom) { conditions.push('i.issue_date >= ?'); values.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push('i.issue_date <= ?'); values.push(filters.dateTo); }
  if (filters.customerId) { conditions.push('i.customer_id = ?'); values.push(filters.customerId); }
  if (filters.status) { conditions.push('i.status = ?'); values.push(filters.status); }
  if (filters.invoiceNumberSearch) { conditions.push('i.invoice_number LIKE ?'); values.push(`%${filters.invoiceNumberSearch}%`); }
  if (filters.minAmount !== undefined) { conditions.push('i.total >= ?'); values.push(filters.minAmount); }
  if (filters.maxAmount !== undefined) { conditions.push('i.total <= ?'); values.push(filters.maxAmount); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return qa(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id ${where} ORDER BY i.created_at DESC`, values) as unknown as InvoiceWithCustomer[];
}

export function getLastInvoice(_db?: SqlJsDatabase): InvoiceWithCustomer | null {
  const conn = _db || getDatabase();
  const row = q(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id ORDER BY i.id DESC LIMIT 1`);
  return (row as unknown as InvoiceWithCustomer) || null;
}

export function getLastInvoiceForCustomer(customerId: number, _db?: SqlJsDatabase): InvoiceWithCustomer | null {
  const conn = _db || getDatabase();
  const row = q(conn, `SELECT i.*, c.name as customer_name FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id WHERE i.customer_id = ? ORDER BY i.id DESC LIMIT 1`, [customerId]);
  return (row as unknown as InvoiceWithCustomer) || null;
}

export function addInvoiceItem(invoiceId: number, data: InvoiceItemInput, _db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  if (!invoiceId) throw new Error('invoiceId is required');
  const maxRow = q(conn, 'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
  const nextOrder = maxRow ? (maxRow.next as number) : 1;
  const hours = data.hours ?? 0;
  const rate = data.rate ?? 0;
  const amount = hours * rate;
  e(conn, `INSERT INTO invoice_items (invoice_id, sort_order, description, lesson_date, hours, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [invoiceId, nextOrder, data.description ?? '', data.lesson_date ?? null, hours, rate, amount]);
  const id = getLastInsertId(conn, 'invoice_items');
  saveDatabase();
  return id;
}

export function getInvoiceItems(invoiceId: number, _db?: SqlJsDatabase): InvoiceItem[] {
  const conn = _db || getDatabase();
  return qa(conn, 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC', [invoiceId]) as unknown as InvoiceItem[];
}

export function updateInvoiceItem(id: number, data: { description?: string; lesson_date?: string | null; hours?: number; rate?: number }, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  const existing = q(conn, 'SELECT * FROM invoice_items WHERE id = ?', [id]);
  if (!existing) return;
  const description = data.description ?? (existing.description as string) ?? '';
  const hours = (data.hours ?? (existing.hours as number)) ?? 0;
  const rate = (data.rate ?? (existing.rate as number)) ?? 0;
  const lessonDate = data.lesson_date !== undefined ? data.lesson_date : (existing.lesson_date as string | null);
  const amount = hours * rate;
  e(conn, 'UPDATE invoice_items SET description = ?, lesson_date = ?, hours = ?, rate = ?, amount = ? WHERE id = ?',
    [description, lessonDate, hours, rate, amount, id]);
  saveDatabase();
}

export function deleteInvoiceItem(id: number, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  e(conn, 'DELETE FROM invoice_items WHERE id = ?', [id]);
  saveDatabase();
}

export function recalculateInvoiceTotals(invoiceId: number, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  if (!invoiceId) return;
  const items = getInvoiceItems(invoiceId, conn);
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const inv = q(conn, 'SELECT discount_percent FROM invoices WHERE id = ?', [invoiceId]);
  const discountPercent = inv ? ((inv.discount_percent as number) ?? 0) : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  const now = new Date().toISOString();
  e(conn, 'UPDATE invoices SET subtotal = ?, discount_amount = ?, total = ?, updated_at = ? WHERE id = ?',
    [subtotal, discountAmount, total, now, invoiceId]);
  saveDatabase();
}

export function calculateTotals(items: { hours: number; rate: number }[]): { subtotal: number } {
  return { subtotal: items.reduce((sum, item) => sum + item.hours * item.rate, 0) };
}

/**
 * Returns true if an invoice with the given number already exists.
 */
function invoiceNumberExists(conn: SqlJsDatabase, number: string): boolean {
  const row = q(conn, 'SELECT 1 FROM invoices WHERE invoice_number = ?', [number]);
  return !!row;
}

/**
 * Generates the NEXT FREE invoice number WITHOUT incrementing the counter.
 * The counter is incremented only inside createInvoice on success.
 * Skips any numbers already used by existing invoices.
 */
export function generateInvoiceNumber(_db?: SqlJsDatabase): string {
  const conn = _db || getDatabase();
  const settings = getSettings(conn);
  if (!settings) return 'INV-0001';
  const prefix = settings.invoice_prefix;
  const year = new Date().getFullYear().toString();
  const row = q(conn, 'SELECT invoice_counter FROM settings WHERE id = 1');
  let counter = row ? (row.invoice_counter as number) : 1;

  // Find the next free number, skipping any already in use
  const MAX_ATTEMPTS = 100;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = `${prefix}${year}-${String(counter).padStart(4, '0')}`;
    if (!invoiceNumberExists(conn, candidate)) {
      return candidate;
    }
    counter++;
  }

  throw new Error('Failed to generate a free invoice number after 100 attempts');
}

/**
 * Creates an invoice with a unique number.
 * If UNIQUE constraint fails, retries with next counter value.
 */
export function createInvoiceWithNumber(data: InvoiceInput, _db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  let attempts = 0;
  while (attempts < 10) {
    const invNum = generateInvoiceNumber(conn);
    try {
      e(conn, `INSERT INTO invoices (invoice_number, issue_date, due_date, customer_id, status, currency,
        subtotal, discount_percent, discount_amount, total, notes, payment_terms, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invNum, data.issue_date, data.due_date, data.customer_id,
         data.status ?? 'draft', data.currency ?? 'HKD',
         data.subtotal ?? 0, data.discount_percent ?? 0, data.discount_amount ?? 0, data.total ?? 0,
         data.notes ?? null, data.payment_terms ?? null, now, now]);
      incrementCounter(conn);
      const id = getLastInsertId(conn, 'invoices');
      saveDatabase();
      return id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNIQUE constraint')) {
        incrementCounter(conn);
        attempts++;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to generate unique invoice number after 10 attempts');
}
