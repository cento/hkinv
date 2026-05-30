import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../../../src/database/connection');

let isDatabaseOpen: () => boolean;
let getDbPath: () => string | null;
let getDatabase: () => any;

describe('connection module — sync functions only', () => {
  beforeEach(async () => {
    const mod = await import('../../../src/database/connection');
    isDatabaseOpen = mod.isDatabaseOpen;
    getDbPath = mod.getDbPath;
    getDatabase = mod.getDatabase;
  });

  it('isDatabaseOpen returns false before any database is created', () => {
    expect(isDatabaseOpen()).toBe(false);
  });

  it('getDbPath returns null before any database is created', () => {
    expect(getDbPath()).toBeNull();
  });

  it('getDatabase throws before initialization', () => {
    expect(() => getDatabase()).toThrow('Database not initialized.');
  });
});
