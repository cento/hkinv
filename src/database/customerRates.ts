import { Database as SqlJsDatabase, Statement } from 'sql.js';
import { getDatabase, saveDatabase } from './connection';
import { getServiceTypeById } from './serviceTypes';

export interface CustomerRate {
  id: number;
  customer_id: number;
  service_type_id: number;
  custom_rate: number;
  custom_description: string | null;
  created_at: string;
  updated_at: string;
}
export interface CustomerRateWithServiceName extends CustomerRate {
  service_name: string;
}

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

export function setCustomerRate(customerId: number, serviceTypeId: number, customRate: number, customDescription?: string | null, _db?: SqlJsDatabase): number {
  const conn = _db || getDatabase();
  const now = new Date().toISOString();
  const existing = q(conn, 'SELECT 1 FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [customerId, serviceTypeId]);
  if (existing) {
    e(conn, 'UPDATE customer_rates SET custom_rate = ?, custom_description = ?, updated_at = ? WHERE customer_id = ? AND service_type_id = ?',
      [customRate, customDescription ?? null, now, customerId, serviceTypeId]);
  } else {
    e(conn, 'INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, custom_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, serviceTypeId, customRate, customDescription ?? null, now, now]);
  }
  saveDatabase();
  const row = q(conn, 'SELECT id FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [customerId, serviceTypeId]);
  return row ? (row.id as number) : 0;
}

export function getCustomerRate(customerId: number, serviceTypeId: number, _db?: SqlJsDatabase): CustomerRate | null {
  const conn = _db || getDatabase();
  const row = q(conn, 'SELECT * FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [customerId, serviceTypeId]);
  return (row as unknown as CustomerRate) || null;
}

export function getAllRatesForCustomer(customerId: number, _db?: SqlJsDatabase): CustomerRateWithServiceName[] {
  const conn = _db || getDatabase();
  return qa(conn, `SELECT cr.*, st.name as service_name FROM customer_rates cr
    LEFT JOIN service_types st ON cr.service_type_id = st.id WHERE cr.customer_id = ? ORDER BY st.name ASC`, [customerId]) as unknown as CustomerRateWithServiceName[];
}

export function deleteCustomerRate(id: number, _db?: SqlJsDatabase): void {
  const conn = _db || getDatabase();
  e(conn, 'DELETE FROM customer_rates WHERE id = ?', [id]);
  saveDatabase();
}

export function resolveRate(customerId: number, serviceTypeId: number, _db?: SqlJsDatabase): { rate: number; description: string | null } {
  const conn = _db || getDatabase();
  const rate = getCustomerRate(customerId, serviceTypeId, conn);
  if (rate) return { rate: rate.custom_rate, description: rate.custom_description };
  const svc = getServiceTypeById(serviceTypeId, conn);
  if (svc) return { rate: svc.default_rate, description: svc.description_template };
  return { rate: 0, description: null };
}