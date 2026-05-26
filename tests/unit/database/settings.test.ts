import { describe, it, expect } from 'vitest';
import { createTestDb, q, e } from './helpers';
import { saveSettings, getSettings } from '../../../src/database/settings';

describe('Settings', () => {
  it('should return null when no settings exist', async () => {
    const db = await createTestDb();
    const row = q(db, 'SELECT * FROM settings WHERE id = 1');
    expect(row).toBeUndefined();
    db.close();
  });

  it('should insert the first settings row with id=1', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO settings (id, teacher_name, teacher_address, teacher_email, teacher_phone,
      br_number, invoice_prefix, invoice_counter, default_payment_terms, default_currency, bank_details,
      created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['Mario Rossi', 'Via Roma 1, HK', 'mario@test.com', '+852 1234', 'BR-001', 'INV-', 5, '30 giorni', 'HKD', 'HSBC 123']);
    
    const row = q(db, 'SELECT teacher_name, teacher_address, br_number, invoice_prefix, invoice_counter FROM settings WHERE id = 1');
    expect(row).toBeDefined();
    expect(row!.teacher_name).toBe('Mario Rossi');
    expect(row!.br_number).toBe('BR-001');
    expect(row!.invoice_prefix).toBe('INV-');
    expect(row!.invoice_counter).toBe(5);
    db.close();
  });

  it('should update existing settings row (not create a second one)', async () => {
    const db = await createTestDb();
    // Insert
    e(db, `INSERT INTO settings (id, teacher_name, teacher_address, invoice_prefix, invoice_counter,
      default_payment_terms, default_currency, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['Mario', 'Addr', 'INV-', 1, '30g', 'HKD']);
    
    // Update
    e(db, 'UPDATE settings SET teacher_name = ?, updated_at = datetime(\'now\') WHERE id = 1', ['Mario Updated']);
    
    const rows = q(db, 'SELECT COUNT(*) as cnt FROM settings');
    expect(rows!.cnt).toBe(1);
    
    const row = q(db, 'SELECT teacher_name FROM settings WHERE id = 1');
    expect(row!.teacher_name).toBe('Mario Updated');
    db.close();
  });

  it('should increment the invoice counter', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO settings (id, teacher_name, teacher_address, invoice_prefix, invoice_counter,
      default_payment_terms, default_currency, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['Mario', 'Addr', 'INV-', 5, '30g', 'HKD']);
    
    e(db, 'UPDATE settings SET invoice_counter = invoice_counter + 1, updated_at = datetime(\'now\') WHERE id = 1');
    const row = q(db, 'SELECT invoice_counter FROM settings WHERE id = 1');
    expect(row!.invoice_counter).toBe(6);
    
    // Second increment
    e(db, 'UPDATE settings SET invoice_counter = invoice_counter + 1, updated_at = datetime(\'now\') WHERE id = 1');
    const row2 = q(db, 'SELECT invoice_counter FROM settings WHERE id = 1');
    expect(row2!.invoice_counter).toBe(7);
    db.close();
  });

  it('should return saved data via production getSettings after saveSettings', async () => {
    const db = await createTestDb();
    saveSettings({
      teacher_name: 'Mario Rossi',
      teacher_address: 'Via Roma 1, HK',
      teacher_email: 'mario@test.com',
      teacher_phone: '+852 1234 5678',
      br_number: 'BR-98765',
      invoice_prefix: 'INV-',
      invoice_counter: 5,
      default_payment_terms: '30 giorni',
      default_currency: 'HKD',
      bank_details: 'HSBC 123-456-789',
    }, db);

    const data = getSettings(db);
    expect(data).not.toBeNull();
    expect(data!.teacher_name).toBe('Mario Rossi');
    expect(data!.teacher_address).toBe('Via Roma 1, HK');
    expect(data!.teacher_email).toBe('mario@test.com');
    expect(data!.teacher_phone).toBe('+852 1234 5678');
    expect(data!.br_number).toBe('BR-98765');
    expect(data!.invoice_prefix).toBe('INV-');
    expect(data!.invoice_counter).toBe(5);
    expect(data!.default_payment_terms).toBe('30 giorni');
    expect(data!.default_currency).toBe('HKD');
    expect(data!.bank_details).toBe('HSBC 123-456-789');

    // Update and verify again
    saveSettings({
      teacher_name: 'Mario Rossi Updated',
      teacher_address: 'Via Roma 2, HK',
      teacher_email: 'mario.updated@test.com',
      teacher_phone: '+852 9999 8888',
      br_number: 'BR-12345',
      invoice_prefix: 'INV-',
      invoice_counter: 10,
      default_payment_terms: '60 giorni',
      default_currency: 'HKD',
      bank_details: 'HSBC 999-888-777',
    }, db);

    const data2 = getSettings(db);
    expect(data2).not.toBeNull();
    expect(data2!.teacher_name).toBe('Mario Rossi Updated');
    expect(data2!.teacher_address).toBe('Via Roma 2, HK');
    expect(data2!.invoice_prefix).toBe('INV-');
    expect(data2!.invoice_counter).toBe(10);
    db.close();
  });
});

  it("should preserve invoice_counter across updates", async () => {
    const db = await createTestDb();
    e(db, "INSERT INTO settings (id, teacher_name, teacher_address, invoice_prefix, invoice_counter, default_payment_terms, default_currency, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      ["Mario", "Addr", "INV-", 42, "30g", "HKD"]);
    e(db, "UPDATE settings SET teacher_name = ?, updated_at = datetime('now') WHERE id = 1", ["New Name"]);
    const row = q(db, "SELECT invoice_counter FROM settings WHERE id = 1");
    expect(row!.invoice_counter).toBe(42);
    db.close();
  });
