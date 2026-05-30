import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { readOPFSFile, writeOPFSFile, DB_FILENAME } from './opfs';

let db: SqlJsDatabase | null = null;
let dbFilePath: string | null = null;
let SQL: SqlJsStatic | null = null;

async function getSql() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => wasmUrl,
    });
  }
  return SQL;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = new Uint8Array(db.export());
  writeOPFSFile(DB_FILENAME, data.buffer);
}

export async function createDatabase(): Promise<SqlJsDatabase> {
  const sql = await getSql();
  db = new sql.Database();
  dbFilePath = DB_FILENAME;
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  saveDatabase();
  return db;
}

let onSaveCallback: (() => void) | null = null;

export function onSave(callback: () => void): void {
  onSaveCallback = callback;
}

export function notifySave() {
  if (onSaveCallback) onSaveCallback();
}

export { saveDatabase as saveToOPFS };

export async function openDatabase(): Promise<SqlJsDatabase> {
  const buffer = await readOPFSFile(DB_FILENAME);
  if (!buffer) {
    return createDatabase();
  }
  const sql = await getSql();
  db = new sql.Database(new Uint8Array(buffer));
  dbFilePath = DB_FILENAME;
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  return db;
}

export async function importDatabase(buffer: ArrayBuffer): Promise<SqlJsDatabase> {
  const sql = await getSql();
  if (db) {
    db.close();
  }
  db = new sql.Database(new Uint8Array(buffer));
  dbFilePath = DB_FILENAME;
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  await writeOPFSFile(DB_FILENAME, buffer);
  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    dbFilePath = null;
  }
}

export function isDatabaseOpen(): boolean {
  return db !== null;
}

export function getDbPath(): string | null {
  return dbFilePath;
}
