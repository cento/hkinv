import { describe, it, expect } from 'vitest';
import { createTestDb, q, qa, e } from './helpers';

describe('Service Types', () => {
  it('should create a service type', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO service_types (name, description_template, default_rate, default_hours, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['Lezione individuale', 'Lezione di italiano individuale', 500, 1]);
    
    const row = q(db, 'SELECT * FROM service_types');
    expect(row).toBeDefined();
    expect(row!.name).toBe('Lezione individuale');
    expect(row!.default_rate).toBe(500);
    expect(row!.default_hours).toBe(1);
    db.close();
  });

  it('should get all service types ordered by name', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Workshop', 1000, 3]);
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Gruppo', 350, 1.5]);
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Individuale', 500, 1]);
    
    const all = qa(db, 'SELECT * FROM service_types ORDER BY name ASC');
    expect(all[0].name).toBe('Gruppo');
    expect(all[1].name).toBe('Individuale');
    expect(all[2].name).toBe('Workshop');
    expect(all).toHaveLength(3);
    db.close();
  });

  it('should update a service type', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Lezione', 500, 1]);
    const row = q(db, 'SELECT id FROM service_types');
    const id = row!.id as number;
    
    e(db, 'UPDATE service_types SET default_rate = ? WHERE id = ?', [550, id]);
    const updated = q(db, 'SELECT * FROM service_types WHERE id = ?', [id]);
    expect(updated!.default_rate).toBe(550);
    db.close();
  });

  it('should delete a service type', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Temp', 100, 1]);
    const row = q(db, 'SELECT id FROM service_types');
    const id = row!.id as number;
    
    e(db, 'DELETE FROM service_types WHERE id = ?', [id]);
    const after = q(db, 'SELECT * FROM service_types WHERE id = ?', [id]);
    expect(after).toBeUndefined();
    db.close();
  });

  it('should detect if service type is in use', async () => {
    const db = await createTestDb();
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Test', 100, 1]);
    const svc = q(db, 'SELECT id FROM service_types');
    const svcId = svc!.id as number;
    
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Customer']);
    const cust = q(db, 'SELECT id FROM customers');
    const custId = cust!.id as number;
    
    // No customer_rates yet → not in use
    const notInUse = q(db, 'SELECT 1 FROM customer_rates WHERE service_type_id = ? LIMIT 1', [svcId]);
    expect(notInUse).toBeUndefined();
    
    // Add customer rate
    e(db, `INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, [custId, svcId, 450]);
    
    // Now it should be in use
    const inUse = q(db, 'SELECT 1 FROM customer_rates WHERE service_type_id = ? LIMIT 1', [svcId]);
    expect(inUse).toBeDefined();
    db.close();
  });
});
