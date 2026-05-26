import { Database as SqlJsDatabase, Statement } from 'sql.js';
import { getDatabase, saveDatabase } from './connection';

export interface Customer {
  id: number;
  name: string;
  address: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

const ALLOWED_CUSTOMER_COLUMNS = [
  'name', 'address', 'contact_person', 'email', 'phone', 'notes',
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

export function createCustomer(data: CustomerInput, _db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  e(conn, `INSERT INTO customers (name, address, contact_person, email, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.address, data.contact_person, data.email, data.phone, data.notes, now, now]);
  const id = getLastInsertId(conn, 'customers');
  saveDatabase();
  return id;
}

export function getAllCustomers(_db?: SqlJsDatabase): Customer[] {
  const conn = _db || getDatabase();
  return qa(conn, 'SELECT * FROM customers ORDER BY name ASC') as unknown as Customer[];
}

export function getCustomerById(id: number | null | undefined, _db?: SqlJsDatabase): Customer | null {
  if (!id) return null;
  const conn = _db || getDatabase();
  const row = q(conn, 'SELECT * FROM customers WHERE id = ?', [id]);
  return (row as unknown as Customer) || null;
}

export function updateCustomer(id: number, data: Partial<CustomerInput>, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = []; const values: SqlParam[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && ALLOWED_CUSTOMER_COLUMNS.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value as SqlParam);
    }
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); values.push(now, id);
  e(conn, `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteCustomer(id: number, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  e(conn, 'DELETE FROM customers WHERE id = ?', [id]);
  saveDatabase();
}

export function searchCustomers(query: string, _db?: SqlJsDatabase): Customer[] {
  const conn = _db || getDatabase();
  const escaped = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const like = `%${escaped}%`;
  return qa(conn, 'SELECT * FROM customers WHERE name LIKE ? ESCAPE \'\\\' OR email LIKE ? ESCAPE \'\\\' OR contact_person LIKE ? ESCAPE \'\\\' ORDER BY name ASC', [like, like, like]) as unknown as Customer[];
}