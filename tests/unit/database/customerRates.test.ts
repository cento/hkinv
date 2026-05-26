import { describe, it, expect } from 'vitest';
import { createTestDb, q, qa, e } from './helpers';

describe('Customer Rates', () => {
  async function seedData(db: any): Promise<{ custId: number; svcId: number }> {
    e(db, `INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`, ['Test Customer']);
    const cust = q(db, 'SELECT id FROM customers');
    const custId = cust!.id as number;
    
    e(db, `INSERT INTO service_types (name, default_rate, default_hours, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`, ['Individuale', 500, 1]);
    const svc = q(db, 'SELECT id FROM service_types');
    const svcId = svc!.id as number;
    
    return { custId, svcId };
  }

  it('should set a customer rate (insert)', async () => {
    const db = await createTestDb();
    const { custId, svcId } = await seedData(db);
    
    e(db, `INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))`, [custId, svcId, 450]);
    
    const row = q(db, 'SELECT * FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [custId, svcId]);
    expect(row).toBeDefined();
    expect(row!.custom_rate).toBe(450);
    db.close();
  });

  it('should update an existing rate (UPSERT)', async () => {
    const db = await createTestDb();
    const { custId, svcId } = await seedData(db);
    
    // Insert
    e(db, `INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))`, [custId, svcId, 450]);
    
    // Update via explicit UPDATE
    e(db, 'UPDATE customer_rates SET custom_rate = ? WHERE customer_id = ? AND service_type_id = ?', [430, custId, svcId]);
    
    const row = q(db, 'SELECT custom_rate FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [custId, svcId]);
    expect(row!.custom_rate).toBe(430);
    db.close();
  });

  it('should get all rates for a customer with service name', async () => {
    const db = await createTestDb();
    const { custId, svcId } = await seedData(db);
    
    e(db, `INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))`, [custId, svcId, 450]);
    
    const rates = qa(db, `SELECT cr.*, st.name as service_name FROM customer_rates cr
      LEFT JOIN service_types st ON cr.service_type_id = st.id WHERE cr.customer_id = ?`, [custId]);
    
    expect(rates).toHaveLength(1);
    expect(rates[0].service_name).toBe('Individuale');
    expect(rates[0].custom_rate).toBe(450);
    db.close();
  });

  it('should return null when no override exists', async () => {
    const db = await createTestDb();
    const { custId, svcId } = await seedData(db);
    
    const row = q(db, 'SELECT * FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [custId, svcId]);
    expect(row).toBeUndefined();
    db.close();
  });

  it('should delete a customer rate', async () => {
    const db = await createTestDb();
    const { custId, svcId } = await seedData(db);
    
    e(db, `INSERT INTO customer_rates (customer_id, service_type_id, custom_rate, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))`, [custId, svcId, 450]);
    
    e(db, 'DELETE FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [custId, svcId]);
    
    const after = q(db, 'SELECT * FROM customer_rates WHERE customer_id = ? AND service_type_id = ?', [custId, svcId]);
    expect(after).toBeUndefined();
    db.close();
  });
});
