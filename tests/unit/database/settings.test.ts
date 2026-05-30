import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as settingsDb from '../../../src/database/settings';

let db: SqlJsDatabase;
let SQL: any;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => { db = new SQL.Database(); db.run('PRAGMA foreign_keys = ON'); runMigrations(db); });

describe('Settings', () => {
  it('should return null when no settings exist', () => {
    expect(settingsDb.getSettings(db)).toBeNull();
  });

  it('should return false for hasSettings when no settings exist', () => {
    expect(settingsDb.hasSettings(db)).toBe(false);
  });

  it('should insert the first settings row with id=1', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario Rossi', teacher_address: 'Via Roma 1, HK',
      teacher_email: 'mario@test.com', teacher_phone: '+852 1234',
      br_number: 'BR-001', invoice_prefix: 'INV-', invoice_counter: 5,
      default_payment_terms: '30 giorni', default_currency: 'HKD',
      bank_details: 'HSBC 123',
    }, db);
    const s = settingsDb.getSettings(db);
    expect(s).not.toBeNull();
    expect(s!.teacher_name).toBe('Mario Rossi');
    expect(s!.br_number).toBe('BR-001');
    expect(s!.invoice_prefix).toBe('INV-');
    expect(s!.invoice_counter).toBe(5);
    expect(settingsDb.hasSettings(db)).toBe(true);
  });

  it('should update existing settings row (not create a second one)', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    }, db);
    settingsDb.saveSettings({
      teacher_name: 'Mario Updated', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 1,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    }, db);
    const s = settingsDb.getSettings(db);
    expect(s!.teacher_name).toBe('Mario Updated');
    const count = db.exec('SELECT COUNT(*) as cnt FROM settings');
    expect(count[0].values[0][0]).toBe(1);
  });

  it('should increment the invoice counter', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 5,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    }, db);
    const c1 = settingsDb.incrementCounter(db);
    expect(c1).toBe(6);
    const c2 = settingsDb.incrementCounter(db);
    expect(c2).toBe(7);
    const s = settingsDb.getSettings(db);
    expect(s!.invoice_counter).toBe(7);
  });

  it('should preserve invoice_counter across updates', () => {
    settingsDb.saveSettings({
      teacher_name: 'Mario', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 42,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    }, db);
    settingsDb.saveSettings({
      teacher_name: 'New Name', teacher_address: 'Addr',
      teacher_email: null, teacher_phone: null, br_number: null,
      invoice_prefix: 'INV-', invoice_counter: 42,
      default_payment_terms: '30g', default_currency: 'HKD', bank_details: null,
    }, db);
    const s = settingsDb.getSettings(db);
    expect(s!.invoice_counter).toBe(42);
  });
});
