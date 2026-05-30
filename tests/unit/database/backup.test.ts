import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import type { SqlJsStatic, Database as SqlJsDatabase } from 'sql.js';

vi.unmock('../../../src/database/opfs');
vi.unmock('../../../src/database/backup');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let writeOPFSFile: (name: string, data: ArrayBuffer) => Promise<void>;
let deleteOPFSFile: (name: string) => Promise<void>;
let DB_FILENAME: string;

let mockDb: SqlJsDatabase;
let SQL: SqlJsStatic;

let triggerBackup: (manual?: boolean) => Promise<boolean>;
let startBackupTimer: () => void;
let stopBackupTimer: () => void;
let isBackupConfigured: () => boolean;
let getLastBackupTime: () => Date | null;
let getBackupFileName: () => string | null;

vi.mock('../../../src/database/connection', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original as any,
    getDatabase: () => mockDb,
  };
});

const BACKUP_META_KEY = 'hkinv-backup-meta';

describe('Backup system', () => {
  let backupEvents: { success: boolean; manual: boolean }[] = [];

  beforeAll(async () => {
    SQL = await initSqlJs();
    const mod = await import('../../../src/database/opfs');
    writeOPFSFile = mod.writeOPFSFile;
    deleteOPFSFile = mod.deleteOPFSFile;
    DB_FILENAME = mod.DB_FILENAME;
  });

  afterAll(async () => {
    await deleteOPFSFile(DB_FILENAME);
  });

  beforeEach(async () => {
    backupEvents = [];
    await deleteOPFSFile(DB_FILENAME);
    mockDb = new SQL.Database();

    const { getStoredBackupFileName } = await import('../../../src/database/fsa');
    vi.mocked(getStoredBackupFileName).mockImplementation(() => {
      try {
        const raw = localStorage.getItem(BACKUP_META_KEY);
        if (!raw) return null;
        return JSON.parse(raw).name || null;
      } catch {
        return null;
      }
    });

    const backup = await import('../../../src/database/backup');
    triggerBackup = backup.triggerBackup;
    startBackupTimer = backup.startBackupTimer;
    stopBackupTimer = backup.stopBackupTimer;
    isBackupConfigured = backup.isBackupConfigured;
    getLastBackupTime = backup.getLastBackupTime;
    getBackupFileName = backup.getBackupFileName;

    window.addEventListener('hkinv:backup', ((e: Event) => {
      const detail = (e as CustomEvent).detail;
      backupEvents.push(detail);
    }) as EventListener);
  });

  afterEach(() => {
    stopBackupTimer();
    try { mockDb?.close(); } catch { /* Ignored */ }
    localStorage.removeItem(BACKUP_META_KEY);
  });

  it('triggerBackup returns false when no backup handle', async () => {
    localStorage.removeItem(BACKUP_META_KEY);
    const result = await triggerBackup(true);
    expect(result).toBe(false);
  });

  it('triggerBackup dispatches backup event with success=false when no handle', async () => {
    localStorage.removeItem(BACKUP_META_KEY);
    await triggerBackup(false);
    expect(backupEvents.length).toBeGreaterThan(0);
    expect(backupEvents[0].success).toBe(false);
    expect(backupEvents[0].manual).toBe(false);
  });

  it('triggerBackup with manual=true dispatches manual event', async () => {
    localStorage.removeItem(BACKUP_META_KEY);
    await triggerBackup(true);
    expect(backupEvents.length).toBeGreaterThan(0);
    expect(backupEvents[0].manual).toBe(true);
  });

  it('isBackupConfigured returns false when no handle stored', () => {
    localStorage.removeItem(BACKUP_META_KEY);
    expect(isBackupConfigured()).toBe(false);
  });

  it('isBackupConfigured returns true when handle stored', () => {
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: 'test.hkinv' }));
    expect(isBackupConfigured()).toBe(true);
    localStorage.removeItem(BACKUP_META_KEY);
  });

  it('getBackupFileName returns name from stored handle', () => {
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: 'my-archive.hkinv' }));
    expect(getBackupFileName()).toBe('my-archive.hkinv');
    localStorage.removeItem(BACKUP_META_KEY);
  });

  it('backup timer starts and triggers backup periodically', async () => {
    vi.useFakeTimers();
    startBackupTimer();

    vi.advanceTimersByTime(5 * 60 * 1000 + 100);

    await vi.waitFor(() => {
      expect(backupEvents.length).toBeGreaterThan(0);
    });

    stopBackupTimer();
    vi.useRealTimers();
  });

  it('getLastBackupTime returns null before any backup', () => {
    expect(getLastBackupTime()).toBeNull();
  });

  it('isBackupConfigured returns false after clearing handle', () => {
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: 'old.hkinv' }));
    expect(isBackupConfigured()).toBe(true);
    localStorage.removeItem(BACKUP_META_KEY);
    expect(isBackupConfigured()).toBe(false);
  });
});
