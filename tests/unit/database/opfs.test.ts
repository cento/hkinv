import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.unmock('../../../src/database/opfs');

const TEST_FILENAME = 'test-data.bin';
const TEST_DATA = new Uint8Array([1, 2, 3, 4, 5]);

async function getTestRoot() {
  const root = await navigator.storage.getDirectory();
  return root;
}

async function cleanup() {
  try {
    const root = await getTestRoot();
    await root.removeEntry(TEST_FILENAME);
  } catch { /* Ignore: file may not exist */ }
}

describe('OPFS Storage (real navigator.storage)', () => {
  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should write and read a file', async () => {
    const root = await getTestRoot();
    const handle = await root.getFileHandle(TEST_FILENAME, { create: true });
    const writable = await handle.createWritable();
    await writable.write(TEST_DATA);
    await writable.close();

    const file = await handle.getFile();
    const readData = new Uint8Array(await file.arrayBuffer());
    expect(readData).toEqual(TEST_DATA);
  });

  it('should return file not found error for non-existent file', async () => {
    const root = await getTestRoot();
    try {
      await root.getFileHandle('nonexistent-' + Date.now() + '.bin', { create: false });
      expect.unreachable('Should have thrown');
    } catch {
      expect(true).toBe(true);
    }
  });

  it('should delete a file', async () => {
    const root = await getTestRoot();
    const name = 'to-delete.bin';
    const handle = await root.getFileHandle(name, { create: true });
    const w = await handle.createWritable();
    await w.write(new Uint8Array([9]));
    await w.close();

    await root.removeEntry(name);
    try {
      await root.getFileHandle(name, { create: false });
      expect.unreachable('Should have thrown after delete');
    } catch {
      expect(true).toBe(true);
    }
  });
});

describe('opfs.ts module', () => {
  let readOPFSFile: (name: string) => Promise<ArrayBuffer | null>;
  let writeOPFSFile: (name: string, data: ArrayBuffer) => Promise<void>;
  let deleteOPFSFile: (name: string) => Promise<void>;
  let hasOPFSFile: (name: string) => Promise<boolean>;
  let hasExistingDB: () => Promise<boolean>;
  let DB_FILENAME: string;

  beforeAll(async () => {
    const mod = await import('../../../src/database/opfs');
    readOPFSFile = mod.readOPFSFile;
    writeOPFSFile = mod.writeOPFSFile;
    deleteOPFSFile = mod.deleteOPFSFile;
    hasOPFSFile = mod.hasOPFSFile;
    hasExistingDB = mod.hasExistingDB;
    DB_FILENAME = mod.DB_FILENAME;
  });

  afterAll(async () => {
    await deleteOPFSFile(DB_FILENAME);
  });

  it('DB_FILENAME is db.hkinv', () => {
    expect(DB_FILENAME).toBe('db.hkinv');
  });

  it('readOPFSFile returns null for non-existent file', async () => {
    const result = await readOPFSFile('nonexistent-' + Date.now());
    expect(result).toBeNull();
  });

  it('writeOPFSFile writes data and readOPFSFile reads it back', async () => {
    const name = 'test-opfs-' + Date.now() + '.bin';
    const data = new TextEncoder().encode('Hello OPFS').buffer;
    await writeOPFSFile(name, data);

    const read = await readOPFSFile(name);
    expect(read).not.toBeNull();
    const text = new TextDecoder().decode(read!);
    expect(text).toBe('Hello OPFS');

    await deleteOPFSFile(name);
  });

  it('hasOPFSFile returns true for existing file', async () => {
    const name = 'test-has-' + Date.now() + '.bin';
    await writeOPFSFile(name, new TextEncoder().encode('x').buffer);
    expect(await hasOPFSFile(name)).toBe(true);
    await deleteOPFSFile(name);
  });

  it('hasOPFSFile returns false for non-existing file', async () => {
    expect(await hasOPFSFile('never-created-' + Date.now())).toBe(false);
  });

  it('hasExistingDB returns false when no db.hkinv', async () => {
    await deleteOPFSFile(DB_FILENAME);
    expect(await hasExistingDB()).toBe(false);
  });

  it('hasExistingDB returns true after db.hkinv written', async () => {
    await writeOPFSFile(DB_FILENAME, new Uint8Array([0, 0, 0]).buffer);
    expect(await hasExistingDB()).toBe(true);
  });

  it('deleteOPFSFile removes the file', async () => {
    const name = 'test-del-' + Date.now() + '.bin';
    await writeOPFSFile(name, new Uint8Array([1]).buffer);
    expect(await hasOPFSFile(name)).toBe(true);
    await deleteOPFSFile(name);
    expect(await hasOPFSFile(name)).toBe(false);
  });
});
