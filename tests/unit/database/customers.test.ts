import { describe, it, expect } from 'vitest';
import { createTestDb, q, qa, e } from './helpers';

describe('Customers', () => {
  it('should create a customer with all fields', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO customers (name, address, contact_person, email, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['Scuola Italiana HK', '15/F Central', 'Paola B.', 'paola@scuola.hk', '+852 1234', 'Note test']);
    
    const row = q(db, 'SELECT * FROM customers');
    expect(row).toBeDefined();
    expect(row!.name).toBe('Scuola Italiana HK');
    expect(row!.email).toBe('paola@scuola.hk');
    expect(row!.contact_person).toBe('Paola B.');
    db.close();
  });

  it('should get all customers ordered by name', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Zeta School']);
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Alpha School']);
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Beta School']);
    
    const all = qa(db, 'SELECT * FROM customers ORDER BY name ASC');
    expect(all[0].name).toBe('Alpha School');
    expect(all[1].name).toBe('Beta School');
    expect(all[2].name).toBe('Zeta School');
    expect(all).toHaveLength(3);
    db.close();
  });

  it('should update a customer', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['School A']);
    const row = q(db, 'SELECT id FROM customers');
    const id = row!.id as number;
    
    e(db, 'UPDATE customers SET name = ?, email = ? WHERE id = ?', ['School A Updated', 'new@email.com', id]);
    const updated = q(db, 'SELECT * FROM customers WHERE id = ?', [id]);
    expect(updated!.name).toBe('School A Updated');
    expect(updated!.email).toBe('new@email.com');
    db.close();
  });

  it('should delete a customer', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['To Delete']);
    const row = q(db, 'SELECT id FROM customers');
    const id = row!.id as number;
    
    e(db, 'DELETE FROM customers WHERE id = ?', [id]);
    const after = q(db, 'SELECT * FROM customers WHERE id = ?', [id]);
    expect(after).toBeUndefined();
    db.close();
  });

  it('should search by name', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO customers (name, email, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`, ['Scuola Roma', 'roma@test.com']);
    e(db, `INSERT INTO customers (name, email, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`, ['Scuola Milano', 'milano@test.com']);
    e(db, `INSERT INTO customers (name, email, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`, ['Liceo Torino', 'torino@test.com']);
    
    const results = qa(db, 'SELECT * FROM customers WHERE name LIKE ? ORDER BY name ASC', ['%Roma%']);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Scuola Roma');
    db.close();
  });
});
