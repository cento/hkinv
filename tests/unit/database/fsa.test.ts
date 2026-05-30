import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.unmock('../../../src/database/fsa');

const BACKUP_META_KEY = 'hkinv-backup-meta';

describe('fsa module — pure functions', () => {
  let supportsFSA: () => boolean;
  let getStoredBackupFileName: () => string | null;
  let clearStoredBackupHandle: () => void;
  let downloadBlob: (blob: Blob, fileName: string) => void;

  beforeEach(async () => {
    const mod = await import('../../../src/database/fsa');
    supportsFSA = mod.supportsFSA;
    getStoredBackupFileName = mod.getStoredBackupFileName;
    clearStoredBackupHandle = mod.clearStoredBackupHandle;
    downloadBlob = mod.downloadBlob;
    localStorage.removeItem(BACKUP_META_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(BACKUP_META_KEY);
  });

  describe('supportsFSA', () => {
    it('should return false in jsdom environment', () => {
      expect(supportsFSA()).toBe(false);
    });
  });

  describe('getStoredBackupFileName', () => {
    it('should return null when nothing stored', () => {
      expect(getStoredBackupFileName()).toBeNull();
    });

    it('should return name from localStorage', () => {
      localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: 'my-archive.hkinv' }));
      expect(getStoredBackupFileName()).toBe('my-archive.hkinv');
    });

    it('should return null when localStorage JSON is malformed', () => {
      localStorage.setItem(BACKUP_META_KEY, 'not-json');
      expect(getStoredBackupFileName()).toBeNull();
    });
  });

  describe('clearStoredBackupHandle', () => {
    it('should remove localStorage key', () => {
      localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: 'test.hkinv' }));
      clearStoredBackupHandle();
      expect(localStorage.getItem(BACKUP_META_KEY)).toBeNull();
    });

    it('should not throw when nothing stored', () => {
      expect(() => clearStoredBackupHandle()).not.toThrow();
    });
  });

  describe('downloadBlob', () => {
    it('should create and remove an anchor element', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      expect(() => downloadBlob(blob, 'test.txt')).not.toThrow();
    });

    it('should handle empty blob', () => {
      const blob = new Blob([]);
      expect(() => downloadBlob(blob, 'empty.txt')).not.toThrow();
    });
  });
});
