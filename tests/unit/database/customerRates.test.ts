import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as customerRatesDb from '../../../src/database/customerRates';
import * as customersDb from '../../../src/database/customers';
import * as serviceTypesDb from '../../../src/database/serviceTypes';

let db: SqlJsDatabase;
let SQL: any;
let custId: number;
let svcId: number;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => {
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  runMigrations(db);
  custId = customersDb.createCustomer({ name: 'Test Customer' }, db);
  svcId = serviceTypesDb.createServiceType({ name: 'Individuale', default_rate: 500, default_hours: 1 }, db);
});

describe('Customer Rates', () => {
  it('should set a customer rate (insert)', () => {
    const id = customerRatesDb.setCustomerRate(custId, svcId, 450, null, db);
    expect(id).toBeGreaterThan(0);
    const rate = customerRatesDb.getCustomerRate(custId, svcId, db);
    expect(rate).not.toBeNull();
    expect(rate!.custom_rate).toBe(450);
  });

  it('should update an existing rate (UPSERT)', () => {
    customerRatesDb.setCustomerRate(custId, svcId, 450, null, db);
    customerRatesDb.setCustomerRate(custId, svcId, 430, 'Discounted', db);
    const rate = customerRatesDb.getCustomerRate(custId, svcId, db);
    expect(rate!.custom_rate).toBe(430);
    expect(rate!.custom_description).toBe('Discounted');
  });

  it('should get all rates for a customer with service name', () => {
    customerRatesDb.setCustomerRate(custId, svcId, 450, null, db);
    const rates = customerRatesDb.getAllRatesForCustomer(custId, db);
    expect(rates).toHaveLength(1);
    expect(rates[0].service_name).toBe('Individuale');
    expect(rates[0].custom_rate).toBe(450);
  });

  it('should return null when no override exists', () => {
    const rate = customerRatesDb.getCustomerRate(custId, svcId, db);
    expect(rate).toBeNull();
  });

  it('should delete a customer rate', () => {
    const id = customerRatesDb.setCustomerRate(custId, svcId, 450, null, db);
    customerRatesDb.deleteCustomerRate(id, db);
    expect(customerRatesDb.getCustomerRate(custId, svcId, db)).toBeNull();
  });

  it('should resolve custom rate over default', () => {
    customerRatesDb.setCustomerRate(custId, svcId, 400, null, db);
    const resolved = customerRatesDb.resolveRate(custId, svcId, db);
    expect(resolved.rate).toBe(400);
  });

  it('should resolve default rate when no custom rate exists', () => {
    const resolved = customerRatesDb.resolveRate(custId, svcId, db);
    expect(resolved.rate).toBe(500);
  });
});
