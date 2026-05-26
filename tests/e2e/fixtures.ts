/**
 * E2E test fixture: helper to set up Electron and temporary DB.
 */
import { _electron as electron, ElectronApplication, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export async function startApp(): Promise<{ app: ElectronApplication; window: Page; appWindow: Page; dbPath: string }> {
  const dbPath = path.join(os.tmpdir(), `test-${Date.now()}.hkinv`);
  const app = await electron.launch({
    args: ["."],
  });
  const appWindow = await app.firstWindow();
  await appWindow.waitForLoadState("domcontentloaded");
  
  // Create the DB directly via IPC
  await app.evaluate(({ ipcMain }, filePath) => {
    ipcMain.emit("test:createDb", filePath);
  }, dbPath);
  
  return { app, window: appWindow, appWindow, dbPath };
}

export async function stopApp(app: ElectronApplication, dbPath: string): Promise<void> {
  try {
    // Close the app
    await app.close();
  } catch { /* ignore */ }
  // Cleanup temp DB
  if (dbPath && fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch { /* ignore */ }
  }
}

export async function callIpc(app: ElectronApplication, channel: string, ...args: any[]): Promise<any> {
  return app.evaluate(async ({ ipcMain }, { ch, a }) => {
    return ipcMain.emit(ch, ...a);
  }, { ch: channel, a: args });
}