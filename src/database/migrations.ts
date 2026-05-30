import { Database as SqlJsDatabase } from 'sql.js';
import { saveDatabase } from './connection';

const CURRENT_SCHEMA_VERSION = 1;

const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      teacher_name TEXT NOT NULL,
      teacher_address TEXT NOT NULL,
      teacher_email TEXT,
      teacher_phone TEXT,
      br_number TEXT,
      invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
      invoice_counter INTEGER NOT NULL DEFAULT 1,
      default_payment_terms TEXT NOT NULL DEFAULT '30 giorni',
      default_currency TEXT NOT NULL DEFAULT 'HKD',
      bank_details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
      currency TEXT NOT NULL DEFAULT 'HKD',
      subtotal REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      payment_terms TEXT,
      paid_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      description TEXT NOT NULL,
      lesson_date TEXT,
      hours REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS service_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description_template TEXT,
      default_rate REAL NOT NULL DEFAULT 0,
      default_hours REAL NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS customer_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      service_type_id INTEGER NOT NULL,
      custom_rate REAL NOT NULL,
      custom_description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
      UNIQUE(customer_id, service_type_id)
    )`,
    `CREATE TABLE IF NOT EXISTS db_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
    `CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)`,
    `CREATE INDEX IF NOT EXISTS idx_customer_rates_customer ON customer_rates(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_customer_rates_service ON customer_rates(service_type_id)`,
  ],
};

function queryOne(db: SqlJsDatabase, sql: string, params?: any[]): Record<string, any> | undefined {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  if (!stmt.step()) {
    stmt.free();
    return undefined;
  }
  const result = stmt.getAsObject();
  stmt.free();
  return result;
}

function execute(db: SqlJsDatabase, sql: string, params?: any[]): void {
  if (params) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  } else {
    db.run(sql);
  }
}

function getAppliedVersion(db: SqlJsDatabase): number {
  try {
    const row = queryOne(db, "SELECT value FROM db_meta WHERE key = 'schema_version'");
    return row ? parseInt(row.value as string, 10) : 0;
  } catch { return 0; }
}

function setAppliedVersion(db: SqlJsDatabase, version: number): void {
  execute(db, "INSERT OR REPLACE INTO db_meta (key, value) VALUES ('schema_version', ?)", [version.toString()]);
}

/**
 * Runs all pending migrations. Returns true if any were applied.
 */
export function runMigrations(db: SqlJsDatabase): boolean {
  const currentVersion = getAppliedVersion(db);
  if (currentVersion >= CURRENT_SCHEMA_VERSION) return false;

  for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    const statements = MIGRATIONS[v];
    if (statements) {
      for (const sql of statements) {
        db.run(sql);
      }
      execute(db, "INSERT OR IGNORE INTO db_meta (key, value) VALUES ('app_version', '1.0.0')");
      execute(db, "INSERT OR IGNORE INTO db_meta (key, value) VALUES ('created_at', datetime('now'))");
      setAppliedVersion(db, v);
      saveDatabase();
    }
  }
  return true;
}

export function getCurrentSchemaVersion(): number {
  return CURRENT_SCHEMA_VERSION;
}
