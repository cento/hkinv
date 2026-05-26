import { Database as SqlJsDatabase, Statement } from 'sql.js';
import { getDatabase, saveDatabase } from './connection';

export interface ServiceType {
  id: number;
  name: string;
  description_template: string | null;
  default_rate: number;
  default_hours: number;
  created_at: string;
  updated_at: string;
}
export type ServiceTypeInput = Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>;

const ALLOWED_SERVICE_TYPE_COLUMNS = [
  'name', 'description_template', 'default_rate', 'default_hours',
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

export function createServiceType(data: ServiceTypeInput, _db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  e(conn, 'INSERT INTO service_types (name, description_template, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, data.description_template, data.default_rate, data.default_hours, now, now]);
  const id = getLastInsertId(conn, 'service_types');
  saveDatabase();
  return id;
}

export function getAllServiceTypes(_db?: SqlJsDatabase): ServiceType[] {
  const conn = _db || getDatabase();
  return qa(conn, 'SELECT * FROM service_types ORDER BY name ASC') as unknown as ServiceType[];
}

export function getServiceTypeById(id: number, _db?: SqlJsDatabase): ServiceType | null {
  const conn = _db || getDatabase();
  const row = q(conn, 'SELECT * FROM service_types WHERE id = ?', [id]);
  return (row as unknown as ServiceType) || null;
}

export function updateServiceType(id: number, data: Partial<ServiceTypeInput>, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = []; const values: SqlParam[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && ALLOWED_SERVICE_TYPE_COLUMNS.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value as SqlParam);
    }
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); values.push(now, id);
  e(conn, `UPDATE service_types SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteServiceType(id: number, _db?: SqlJsDatabase): boolean {
  const conn = _db || getDatabase();
  try {
    e(conn, 'DELETE FROM service_types WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch { return false; }
}

export function isServiceTypeInUse(id: number, _db?: SqlJsDatabase): boolean {
  const conn = _db || getDatabase();
  const row = q(conn, 'SELECT 1 FROM customer_rates WHERE service_type_id = ? LIMIT 1', [id]);
  return !!row;
}