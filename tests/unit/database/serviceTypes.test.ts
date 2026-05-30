import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '../../../src/database/migrations';
import * as serviceTypesDb from '../../../src/database/serviceTypes';
import * as customersDb from '../../../src/database/customers';
import * as customerRatesDb from '../../../src/database/customerRates';

let db: SqlJsDatabase;
let SQL: any;

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => { db = new SQL.Database(); db.run('PRAGMA foreign_keys = ON'); runMigrations(db); });

describe('Service Types', () => {
  it('should create a service type', () => {
    const id = serviceTypesDb.createServiceType({
      name: 'Lezione individuale', description_template: 'Lezione di italiano individuale',
      default_rate: 500, default_hours: 1,
    }, db);
    const st = serviceTypesDb.getServiceTypeById(id, db);
    expect(st).toBeDefined();
    expect(st!.name).toBe('Lezione individuale');
    expect(st!.default_rate).toBe(500);
    expect(st!.default_hours).toBe(1);
  });

  it('should get all service types ordered by name', () => {
    serviceTypesDb.createServiceType({ name: 'Workshop', default_rate: 1000, default_hours: 3 }, db);
    serviceTypesDb.createServiceType({ name: 'Gruppo', default_rate: 350, default_hours: 1.5 }, db);
    serviceTypesDb.createServiceType({ name: 'Individuale', default_rate: 500, default_hours: 1 }, db);
    const all = serviceTypesDb.getAllServiceTypes(db);
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('Gruppo');
    expect(all[1].name).toBe('Individuale');
    expect(all[2].name).toBe('Workshop');
  });

  it('should update a service type', () => {
    const id = serviceTypesDb.createServiceType({ name: 'Lezione', default_rate: 500, default_hours: 1 }, db);
    serviceTypesDb.updateServiceType(id, { default_rate: 550 }, db);
    const st = serviceTypesDb.getServiceTypeById(id, db);
    expect(st!.default_rate).toBe(550);
  });

  it('should delete a service type', () => {
    const id = serviceTypesDb.createServiceType({ name: 'Temp', default_rate: 100, default_hours: 1 }, db);
    serviceTypesDb.deleteServiceType(id, db);
    expect(serviceTypesDb.getServiceTypeById(id, db)).toBeNull();
  });

  it('should detect if service type is in use', () => {
    const svcId = serviceTypesDb.createServiceType({ name: 'Test', default_rate: 100, default_hours: 1 }, db);
    const custId = customersDb.createCustomer({ name: 'Customer' }, db);
    expect(serviceTypesDb.isServiceTypeInUse(svcId, db)).toBe(false);
    customerRatesDb.setCustomerRate(custId, svcId, 450, null, db);
    expect(serviceTypesDb.isServiceTypeInUse(svcId, db)).toBe(true);
  });
});
