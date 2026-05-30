import { getDatabase } from './connection';
import { getStoredBackupHandle, writeToHandle, verifyHandlePermission, clearStoredBackupHandle } from './fsa';

let backupTimer: ReturnType<typeof setInterval> | null = null;
let lastBackupTime: Date | null = null;

export function getLastBackupTime(): Date | null {
  return lastBackupTime;
}

function notifyBackup(success: boolean, manual: boolean) {
  window.dispatchEvent(new CustomEvent('hkinv:backup', { detail: { success, manual } }));
}

export async function triggerBackup(manual = false): Promise<boolean> {
  try {
    const handle = await getStoredBackupHandle();
    if (!handle) {
      notifyBackup(false, manual);
      return false;
    }

    const hasPermission = await verifyHandlePermission(handle);
    if (!hasPermission) {
      clearStoredBackupHandle();
      notifyBackup(false, manual);
      return false;
    }

    const db = getDatabase();
    const data = new Uint8Array(db.export());
    await writeToHandle(handle, data.buffer);
    lastBackupTime = new Date();
    notifyBackup(true, manual);
    return true;
  } catch {
    notifyBackup(false, manual);
    return false;
  }
}

export function startBackupTimer(): void {
  stopBackupTimer();
  backupTimer = setInterval(() => {
    triggerBackup(false).catch(() => {});
  }, 5 * 60 * 1000);
}

export function stopBackupTimer(): void {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }
}

export function isBackupConfigured(): boolean {
  try {
    const raw = localStorage.getItem('hkinv-backup-handle');
    return !!raw;
  } catch {
    return false;
  }
}

export function getBackupFileName(): string | null {
  try {
    const raw = localStorage.getItem('hkinv-backup-handle');
    if (!raw) return null;
    return JSON.parse(raw).name || null;
  } catch {
    return null;
  }
}
