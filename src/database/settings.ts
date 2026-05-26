import { Database as SqlJsDatabase, Statement } from 'sql.js';
import { getDatabase, saveDatabase } from './connection';

export interface TeacherSettings {
  id: number;
  teacher_name: string;
  teacher_address: string;
  teacher_email: string | null;
  teacher_phone: string | null;
  br_number: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  default_payment_terms: string;
  default_currency: string;
  bank_details: string | null;
  created_at: string;
  updated_at: string;
}

export type TeacherSettingsInput = Omit<TeacherSettings, 'id' | 'created_at' | 'updated_at'>;

type SqlParam = number | string | null;

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

function e(db: SqlJsDatabase, sql: string, params?: SqlParam[]): void {
  if (params) {
    const sanitized: SqlParam[] = params.map(v => {
      if (typeof v === 'number' && isNaN(v)) return 0;
      return v;
    });
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

export function getSettings(db?: SqlJsDatabase): TeacherSettings | null {
  const conn = db || getDatabase();
  const row = q(conn, 'SELECT * FROM settings WHERE id = 1');
  return (row as unknown as TeacherSettings) || null;
}

export function saveSettings(data: TeacherSettingsInput, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  const existing = q(conn, 'SELECT 1 FROM settings WHERE id = 1');
  if (existing) {
    e(conn, `UPDATE settings SET
      teacher_name = ?, teacher_address = ?, teacher_email = ?, teacher_phone = ?,
      br_number = ?, invoice_prefix = ?, invoice_counter = ?, default_payment_terms = ?,
      default_currency = ?, bank_details = ?, updated_at = ?
      WHERE id = 1`,
      [data.teacher_name, data.teacher_address, data.teacher_email, data.teacher_phone,
       data.br_number, data.invoice_prefix, data.invoice_counter, data.default_payment_terms,
       data.default_currency, data.bank_details, now]);
  } else {
    e(conn, `INSERT INTO settings (id, teacher_name, teacher_address, teacher_email, teacher_phone,
       br_number, invoice_prefix, invoice_counter, default_payment_terms, default_currency,
       bank_details, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.teacher_name, data.teacher_address, data.teacher_email, data.teacher_phone,
       data.br_number, data.invoice_prefix, data.invoice_counter, data.default_payment_terms,
       data.default_currency, data.bank_details, now, now]);
  }
  saveDatabase();
}

export function incrementCounter(_db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  e(conn, 'UPDATE settings SET invoice_counter = invoice_counter + 1, updated_at = ? WHERE id = 1', [new Date().toISOString()]);
  const row = q(conn, 'SELECT invoice_counter FROM settings WHERE id = 1');
  saveDatabase();
  return row ? (row.invoice_counter as number) : 1;
}

export function hasSettings(_db?: SqlJsDatabase): boolean {
  const conn = _db || getDatabase();
  const row = q(conn, 'SELECT 1 FROM settings WHERE id = 1');
  return !!row;
}