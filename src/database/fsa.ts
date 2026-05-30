declare global {
  type FileSystemPermissionMode = 'read' | 'readwrite';

  interface FileSystemHandlePermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemDirectoryHandle {
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
    removeEntry(name: string): Promise<void>;
  }

  interface FileSystemFileHandle {
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface FileSystemGetFileOptions {
    create?: boolean;
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
  }

  interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
  }
  interface FilePickerOptions {
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
    id?: string;
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }
  interface OpenFilePickerOptions extends FilePickerOptions {
    multiple?: boolean;
  }
  interface SaveFilePickerOptions extends FilePickerOptions {
    suggestedName?: string;
  }
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

const HKINV_FILTER = {
  description: 'HK Invoice Archive',
  accept: { 'application/octet-stream': ['.hkinv'] },
};

const IDB_NAME = 'hkinv-backup';
const IDB_STORE = 'handles';
const HANDLE_KEY = 'backup-handle';
const BACKUP_META_KEY = 'hkinv-backup-meta';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function supportsFSA(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

export async function openHKINVFile(): Promise<{ data: ArrayBuffer; handle: FileSystemFileHandle | null } | null> {
  if (supportsFSA()) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [HKINV_FILTER],
        excludeAcceptAllOption: true,
        startIn: 'documents',
      });
      const file = await handle.getFile();
      return { data: await file.arrayBuffer(), handle };
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.hkinv';
    let cleanedUp = false;
    function cleanup() {
      if (cleanedUp) return;
      cleanedUp = true;
      window.removeEventListener('focus', onFocus);
    }
    function onFocus() {
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 500);
    }
    window.addEventListener('focus', onFocus);
    input.onchange = async () => {
      cleanup();
      const file = input.files?.[0];
      if (file) {
        resolve({ data: await file.arrayBuffer(), handle: null });
      } else {
        resolve(null);
      }
    };
    input.click();
  });
}

export async function saveHKINVFile(
  data: ArrayBuffer,
  suggestedName: string
): Promise<FileSystemFileHandle | null> {
  if (supportsFSA()) {
    try {
      const handle = await window.showSaveFilePicker({
        types: [HKINV_FILTER],
        suggestedName,
        startIn: 'documents',
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return handle;
    } catch {
      return null;
    }
  }

  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return null;
}

export async function configureBackupLocation(): Promise<boolean> {
  if (!supportsFSA()) return false;
  try {
    const handle = await window.showSaveFilePicker({
      types: [HKINV_FILTER],
      suggestedName: 'my-archive.hkinv',
      startIn: 'documents',
    });
    const writable = await handle.createWritable();
    await writable.close();
    await storeBackupHandle(handle);
    return true;
  } catch {
    return false;
  }
}

export async function writeToHandle(
  handle: FileSystemFileHandle,
  data: ArrayBuffer
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function verifyHandlePermission(
  handle: FileSystemFileHandle,
  mode: FileSystemPermissionMode = 'readwrite'
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode };
  if ((await handle.queryPermission(opts)) === 'granted') {
    return true;
  }
  return (await handle.requestPermission(opts)) === 'granted';
}

export async function storeBackupHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY);
  const file = await handle.getFile();
  localStorage.setItem(BACKUP_META_KEY, JSON.stringify({ name: file.name }));
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getStoredBackupHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    return new Promise((resolve, reject) => {
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

export function clearStoredBackupHandle(): void {
  openIDB().then(async (db) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(HANDLE_KEY);
    tx.oncomplete = () => db.close();
  }).catch(() => {});
  localStorage.removeItem(BACKUP_META_KEY);
}

export function getStoredBackupFileName(): string | null {
  try {
    const raw = localStorage.getItem(BACKUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw).name || null;
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
