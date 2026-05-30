const DB_FILENAME = 'db.hkinv';

let opfsRoot: FileSystemDirectoryHandle | null = null;

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (!opfsRoot) {
    opfsRoot = await navigator.storage.getDirectory();
  }
  return opfsRoot;
}

export async function readOPFSFile(name: string): Promise<ArrayBuffer | null> {
  try {
    const root = await getRoot();
    const handle = await root.getFileHandle(name, { create: false });
    const file = await handle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

export async function writeOPFSFile(name: string, data: ArrayBuffer): Promise<void> {
  const root = await getRoot();
  const handle = await root.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

export async function deleteOPFSFile(name: string): Promise<void> {
  try {
    const root = await getRoot();
    await root.removeEntry(name);
  } catch { /* Ignore: file may not exist */ }
}

export async function hasOPFSFile(name: string): Promise<boolean> {
  try {
    const root = await getRoot();
    await root.getFileHandle(name, { create: false });
    return true;
  } catch {
    return false;
  }
}

export async function hasExistingDB(): Promise<boolean> {
  return hasOPFSFile(DB_FILENAME);
}

export { DB_FILENAME };
