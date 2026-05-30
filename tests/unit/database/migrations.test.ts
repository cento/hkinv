import { describe, it, expect } from 'vitest';
import { createTestDb, q } from './helpers';
import { runMigrations } from '../../../src/database/migrations';
import initSqlJs from 'sql.js';

describe('Migrations', () => {
  it('should create all 7 tables', async () => {
    const db = await createTestDb();
    const tables = ['settings', 'customers', 'invoices', 'invoice_items', 'service_types', 'customer_rates', 'db_meta'];
    for (const table of tables) {
      const row = q(db, "SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table]);
      expect(row, `Table ${table} should exist`).toBeDefined();
    }
    db.close();
  });

  it('should set db_meta with default values', async () => {
    const db = await createTestDb();
    const schemaVer = q(db, "SELECT value FROM db_meta WHERE key='schema_version'");
    expect(schemaVer).toBeDefined();
    expect(schemaVer!.value).toBe('1');

    const appVer = q(db, "SELECT value FROM db_meta WHERE key='app_version'");
    expect(appVer).toBeDefined();
    expect(appVer!.value).toBe('1.0.0');
    db.close();
  });

  it('should have foreign keys enabled', async () => {
    const db = await createTestDb();
    const row = q(db, 'PRAGMA foreign_keys');
    expect(row).toBeDefined();
    expect(row!.foreign_keys).toBe(1);
    db.close();
  });

  it('should not re-run migrations if already at current version', async () => {
    const db = await createTestDb();
    const ran = runMigrations(db);
    expect(ran).toBe(false);
    const schemaVer = q(db, "SELECT value FROM db_meta WHERE key='schema_version'");
    expect(schemaVer).toBeDefined();
    expect(schemaVer!.value).toBe('1');
    db.close();
  });

  it('should apply pending migrations on fresh database', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const ran = runMigrations(db);
    expect(ran).toBe(true);
    const schemaVer = q(db, "SELECT value FROM db_meta WHERE key='schema_version'");
    expect(schemaVer).toBeDefined();
    expect(schemaVer!.value).toBe('1');
    db.close();
  });
});
