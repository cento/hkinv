import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import initSqlJs from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { createTestDb } from './helpers';

describe('Database Connection', () => {
  it('should initialize sql.js and create an in-memory database', async () => {
    const db = await createTestDb();
    expect(db).toBeDefined();
    // Verify we can run queries
    db.run('SELECT 1');
    db.close();
  });

  it('should create a new database and save to file', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
    db.run('INSERT INTO test VALUES (?, ?)', [1, 'hello']);
    
    const exported = db.export();
    expect(exported).toBeInstanceOf(Uint8Array);
    expect(exported.length).toBeGreaterThan(100);
    
    const tmpPath = path.join(os.tmpdir(), `test-conn-${Date.now()}.hkinv`);
    fs.writeFileSync(tmpPath, Buffer.from(exported));
    expect(fs.existsSync(tmpPath)).toBe(true);
    
    // Re-open
    const buffer = fs.readFileSync(tmpPath);
    const db2 = new SQL.Database(buffer);
    const stmt = db2.prepare('SELECT value FROM test WHERE id = 1');
    stmt.step();
    const row = stmt.getAsObject();
    expect(row.value).toBe('hello');
    stmt.free();
    db2.close();
    
    // Cleanup
    fs.unlinkSync(tmpPath);
    db.close();
  });

  it('should fail to open a non-existent file', async () => {
    const SQL = await initSqlJs();
    expect(() => {
      const buffer = fs.readFileSync('nonexistent-file.hkinv');
      new SQL.Database(buffer);
    }).toThrow();
  });
});
