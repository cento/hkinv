import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as customersDb from '../../../src/database/customers';

let db: SqlJsDatabase;
let SQL: any;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => { db = new SQL.Database(); db.run('PRAGMA foreign_keys = ON'); runMigrations(db); });

describe('Customers', () => {
  it('should create a customer with all fields', () => {
    const id = customersDb.createCustomer({
      name: 'Scuola Italiana HK', address: '15/F Central', contact_person: 'Paola B.',
      email: 'paola@scuola.hk', phone: '+852 1234', notes: 'Note test',
    }, db);
    expect(id).toBeGreaterThan(0);
    const c = customersDb.getCustomerById(id, db);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('Scuola Italiana HK');
    expect(c!.email).toBe('paola@scuola.hk');
    expect(c!.contact_person).toBe('Paola B.');
  });

  it('should get all customers ordered by name', () => {
    customersDb.createCustomer({ name: 'Zeta School' }, db);
    customersDb.createCustomer({ name: 'Alpha School' }, db);
    customersDb.createCustomer({ name: 'Beta School' }, db);
    const all = customersDb.getAllCustomers(db);
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('Alpha School');
    expect(all[1].name).toBe('Beta School');
    expect(all[2].name).toBe('Zeta School');
  });

  it('should update a customer', () => {
    const id = customersDb.createCustomer({ name: 'School A' }, db);
    customersDb.updateCustomer(id, { name: 'School A Updated', email: 'new@email.com' }, db);
    const c = customersDb.getCustomerById(id, db);
    expect(c!.name).toBe('School A Updated');
    expect(c!.email).toBe('new@email.com');
  });

  it('should delete a customer', () => {
    const id = customersDb.createCustomer({ name: 'To Delete' }, db);
    customersDb.deleteCustomer(id, db);
    expect(customersDb.getCustomerById(id, db)).toBeNull();
  });

  it('should search by name', () => {
    customersDb.createCustomer({ name: 'Scuola Roma', email: 'roma@test.com' }, db);
    customersDb.createCustomer({ name: 'Scuola Milano', email: 'milano@test.com' }, db);
    customersDb.createCustomer({ name: 'Liceo Torino', email: 'torino@test.com' }, db);
    const results = customersDb.searchCustomers('Roma', db);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Scuola Roma');
  });
});
