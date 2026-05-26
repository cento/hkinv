import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';

/**
 * Creates a fresh in-memory database with all tables and returns it.
 * Does NOT save to disk (no side effects).
 */
export async function createTestDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  
  // Manually run migrations inline (avoids dependency on connection.ts)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    teacher_name TEXT NOT NULL, teacher_address TEXT NOT NULL,
    teacher_email TEXT, teacher_phone TEXT, br_number TEXT,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    invoice_counter INTEGER NOT NULL DEFAULT 1,
    default_payment_terms TEXT NOT NULL DEFAULT '30 giorni',
    default_currency TEXT NOT NULL DEFAULT 'HKD', bank_details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT,
    contact_person TEXT, email TEXT, phone TEXT, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number TEXT NOT NULL UNIQUE,
    issue_date TEXT NOT NULL, due_date TEXT NOT NULL, customer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
    currency TEXT NOT NULL DEFAULT 'HKD', subtotal REAL NOT NULL DEFAULT 0,
    discount_percent REAL NOT NULL DEFAULT 0, discount_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0, notes TEXT, payment_terms TEXT, paid_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL, description TEXT NOT NULL, lesson_date TEXT,
    hours REAL NOT NULL DEFAULT 1, rate REAL NOT NULL DEFAULT 0, amount REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description_template TEXT,
    default_rate REAL NOT NULL DEFAULT 0, default_hours REAL NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customer_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL,
    service_type_id INTEGER NOT NULL, custom_rate REAL NOT NULL, custom_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
    UNIQUE(customer_id, service_type_id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS db_meta (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`);
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('schema_version', '1')");
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('app_version', '1.0.0')");
  db.run("INSERT OR IGNORE INTO db_meta (key, value) VALUES ('created_at', datetime('now'))");

  return db;
}

type SqlParam = number | string | null;

// Helper query functions (mirror production but take db param)
export function q(db: SqlJsDatabase, sql: string, params?: SqlParam[]): Record<string, unknown> | undefined {
  let stmt: SqlJsDatabase.Statement | null = null;
  try {
    stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const r = stmt.step() ? stmt.getAsObject() : null;
    return r || undefined;
  } finally {
    if (stmt) stmt.free();
  }
}

export function qa(db: SqlJsDatabase, sql: string, params?: SqlParam[]): Record<string, unknown>[] {
  let stmt: SqlJsDatabase.Statement | null = null;
  try {
    stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const results: Record<string, unknown>[] = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally {
    if (stmt) stmt.free();
  }
}

export function e(db: SqlJsDatabase, sql: string, params?: SqlParam[]): void {
  if (params) {
    const sanitized: SqlParam[] = params.map(v => {
      if (typeof v === 'number' && isNaN(v)) return 0;
      return v;
    });
    let stmt: SqlJsDatabase.Statement | null = null;
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