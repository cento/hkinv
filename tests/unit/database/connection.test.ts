import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';

vi.unmock('../../../src/database/opfs');

let writeOPFSFile: (name: string, data: ArrayBuffer) => Promise<void>;
let readOPFSFile: (name: string) => Promise<ArrayBuffer | null>;
let deleteOPFSFile: (name: string) => Promise<void>;
let hasOPFSFile: (name: string) => Promise<boolean>;
let DB_FILENAME: string;

describe('Database save/load via OPFS', () => {
  beforeAll(async () => {
    const mod = await import('../../../src/database/opfs');
    writeOPFSFile = mod.writeOPFSFile;
    readOPFSFile = mod.readOPFSFile;
    deleteOPFSFile = mod.deleteOPFSFile;
    hasOPFSFile = mod.hasOPFSFile;
    DB_FILENAME = mod.DB_FILENAME;
  });

  beforeEach(async () => {
    await deleteOPFSFile(DB_FILENAME);
  });

  afterAll(async () => {
    await deleteOPFSFile(DB_FILENAME);
  });

  it('should create sql.js database, save to OPFS, and reload', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
    db.run('INSERT INTO test VALUES (?, ?)', [1, 'hello']);

    const data = db.export();
    const buffer = new Uint8Array(data).buffer;
    await writeOPFSFile('test-db.hkinv', buffer);
    await hasOPFSFile('test-db.hkinv').then(exists => expect(exists).toBe(true));

    const read = await readOPFSFile('test-db.hkinv');
    expect(read).not.toBeNull();

    const db2 = new SQL.Database(new Uint8Array(read!));
    const stmt = db2.prepare('SELECT value FROM test WHERE id = 1');
    stmt.step();
    const row = stmt.getAsObject();
    expect(row.value).toBe('hello');
    stmt.free();

    db.close();
    db2.close();
    await deleteOPFSFile('test-db.hkinv');
  });

  it('should persist a database with multiple tables', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('CREATE TABLE a (x INTEGER)');
    db.run('CREATE TABLE b (y TEXT)');
    db.run('INSERT INTO a VALUES (?)', [42]);
    db.run('INSERT INTO b VALUES (?)', ['test']);

    const data = db.export();
    await writeOPFSFile('multi.hkinv', new Uint8Array(data).buffer);

    const read = await readOPFSFile('multi.hkinv');
    const db2 = new SQL.Database(new Uint8Array(read!));

    const stmtA = db2.prepare('SELECT x FROM a');
    stmtA.step();
    expect(stmtA.getAsObject().x).toBe(42);
    stmtA.free();

    const stmtB = db2.prepare("SELECT y FROM b WHERE y = 'test'");
    stmtB.step();
    expect(stmtB.getAsObject().y).toBe('test');
    stmtB.free();

    db.close();
    db2.close();
    await deleteOPFSFile('multi.hkinv');
  });

  it('should export empty database correctly', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const data = db.export();
    expect(data).toBeInstanceOf(Uint8Array);
    db.close();
  });

  it('database binary persists across save/load cycle', async () => {
    const SQL = await initSqlJs();

    const db1 = new SQL.Database();
    db1.run('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
    db1.run('INSERT INTO items VALUES (?, ?, ?)', [1, 'Widget', 99.50]);
    db1.run('INSERT INTO items VALUES (?, ?, ?)', [2, 'Gadget', 149.99]);

    const exported = db1.export();
    const originalSize = exported.length;
    db1.close();

    await writeOPFSFile('cycle.hkinv', new Uint8Array(exported).buffer);

    const loaded = await readOPFSFile('cycle.hkinv');
    expect(loaded!.byteLength).toBe(originalSize);

    const db2 = new SQL.Database(new Uint8Array(loaded!));
    const stmt = db2.prepare('SELECT COUNT(*) as cnt FROM items');
    stmt.step();
    expect(stmt.getAsObject().cnt).toBe(2);
    stmt.free();

    db2.close();
    await deleteOPFSFile('cycle.hkinv');
  });
});
