import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import type { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import type initSqlJs from 'sql.js';

const _require = createRequire(__filename);

let db: SqlJsDatabase | null = null;
let dbFilePath: string | null = null;
let SQL: SqlJsStatic | null = null;

async function getSql() {
  if (!SQL) {
    const sqlJsPath = path.join(process.resourcesPath || '', 'dist', 'sql-wasm.js');
    const init = (fs.existsSync(sqlJsPath)
      ? _require(sqlJsPath)
      : _require('sql.js')) as typeof initSqlJs;
    SQL = await init();
  }
  return SQL!;
}

/**
 * Saves the database to disk.
 */
export function saveDatabase(): void {
  if (!db || !dbFilePath) return;
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

/**
 * Creates a new SQLite database file at the given path.
 */
export async function createDatabase(filePath: string): Promise<SqlJsDatabase> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sql = await getSql();
  db = new sql.Database();
  dbFilePath = filePath;
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  saveDatabase();
  return db;
}

/**
 * Opens an existing SQLite database file.
 */
export async function openDatabase(filePath: string): Promise<SqlJsDatabase> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Database file not found: ${filePath}`);
  }
  const sql = await getSql();
  const fileBuffer = fs.readFileSync(filePath);
  db = new sql.Database(fileBuffer);
  dbFilePath = filePath;
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  return db;
}

/**
 * Returns the current database instance.
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db;
}

/**
 * Closes the database and saves.
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    dbFilePath = null;
  }
}

/**
 * Whether the database is connected.
 */
export function isDatabaseOpen(): boolean {
  return db !== null;
}

/**
 * Returns the current DB file path, or null if closed.
 */
export function getDbPath(): string | null {
  return dbFilePath;
}
