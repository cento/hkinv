/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { createDatabase, openDatabase, closeDatabase, getDatabase, isDatabaseOpen, getDbPath } from './database/connection';
import { runMigrations, getCurrentSchemaVersion } from './database/migrations';
import * as settingsDb from './database/settings';
import * as customersDb from './database/customers';
import * as invoicesDb from './database/invoices';
import * as serviceTypesDb from './database/serviceTypes';
import * as customerRatesDb from './database/customerRates';
import { validateSettings, validateCustomer, validateInvoice, validateInvoiceItem, validateServiceType } from './utils/validators';

let mainWindow: BrowserWindow | null = null;

if (process.platform === 'win32' && process.argv[1]?.startsWith('--squirrel')) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'HK Invoice Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

// ----- IPC Handlers: Database management -----

ipcMain.handle('db:create', async (_event, dbPath: string) => {
  try {
    await createDatabase(dbPath);
    runMigrations(getDatabase());
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:open', async (_event, dbPath: string) => {
  try {
    await openDatabase(dbPath);
    runMigrations(getDatabase());
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:close', async () => {
  try {
    closeDatabase();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('db:isOpen', async () => {
  return isDatabaseOpen();
});

ipcMain.handle('db:getSchemaVersion', async () => {
  return getCurrentSchemaVersion();
});

// File dialogs
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Apri archivio fatture',
    filters: [{ name: 'HK Invoice Files', extensions: ['hkinv'] }],
    properties: ['openFile'],
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (_event, defaultName: string) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Crea nuovo archivio',
    defaultPath: defaultName,
    filters: [{ name: 'HK Invoice Files', extensions: ['hkinv'] }],
  });
  return result;
});

ipcMain.handle('dialog:savePDF', async (_event, defaultName: string) => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Esporta PDF',
    defaultPath: defaultName,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result;
});

// Binary file write (for PDF export)
ipcMain.handle('file:writeBinary', async (_event, filePath: string, data: number[]) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// DB backup: copy current DB file with timestamp
ipcMain.handle('db:backup', async () => {
  try {
    const db = getDatabase();
    if (!db) return { success: false, error: 'No database open' };
    const dbPath = getDbPath();
    if (!dbPath) return { success: false, error: 'No DB path' };
    const dir = path.dirname(dbPath);
    const base = path.basename(dbPath, '.hkinv');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dir, `${base}-backup-${timestamp}.hkinv`);
    const data = db.export();
    fs.writeFileSync(backupPath, Buffer.from(data));
    return { success: true, backupPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Import archive: open file dialog and read file for copying
ipcMain.handle('dialog:importFile', async (_event, defaultName: string) => {
  if (!mainWindow) return { canceled: true };
  // First, select source file
  const openResult = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleziona archivio da importare',
    filters: [{ name: 'HK Invoice Files', extensions: ['hkinv'] }],
    properties: ['openFile'],
  });
  if (openResult.canceled || !openResult.filePaths?.[0]) return { canceled: true };
  const sourcePath = openResult.filePaths[0];

  // Then, choose destination
  const saveResult = await dialog.showSaveDialog(mainWindow, {
    title: 'Salva archivio importato come...',
    defaultPath: defaultName,
    filters: [{ name: 'HK Invoice Files', extensions: ['hkinv'] }],
  });
  if (saveResult.canceled || !saveResult.filePath) return { canceled: true };

  try {
    fs.copyFileSync(sourcePath, saveResult.filePath);
    return { success: true, filePath: saveResult.filePath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// ----- IPC Handlers: Settings -----

ipcMain.handle('settings:get', async () => {
  try {
    return settingsDb.getSettings();
  } catch (error) {
    return null;
  }
});

ipcMain.handle('settings:save', async (_event, data) => {
  const validation = validateSettings(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  settingsDb.saveSettings(data);
  return { success: true };
});

ipcMain.handle('settings:has', async () => {
  try {
    return settingsDb.hasSettings();
  } catch (error) {
    return false;
  }
});

ipcMain.handle('settings:incrementCounter', async () => {
  try {
    return settingsDb.incrementCounter();
  } catch (error) {
    return 0;
  }
});

ipcMain.handle('settings:generateInvoiceNumber', async () => {
  try {
    return invoicesDb.generateInvoiceNumber();
  } catch (error) {
    return 'ERR-' + Date.now();
  }
});

// ----- IPC Handlers: Customers -----

ipcMain.handle('customers:create', async (_event, data) => {
  const validation = validateCustomer(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  return customersDb.createCustomer(data);
});

ipcMain.handle('customers:getAll', async () => {
  try {
    return customersDb.getAllCustomers();
  } catch (error) {
    return [];
  }
});

ipcMain.handle('customers:getById', async (_event, id: number) => {
  try {
    if (!id) return null;
    return customersDb.getCustomerById(id);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('customers:update', async (_event, id: number, data) => {
  const validation = validateCustomer(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  customersDb.updateCustomer(id, data);
  return { success: true };
});

ipcMain.handle('customers:delete', async (_event, id: number) => {
  try {
    customersDb.deleteCustomer(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('customers:search', async (_event, query: string) => {
  try {
    return customersDb.searchCustomers(query);
  } catch (error) {
    return [];
  }
});

// ----- IPC Handlers: Invoices -----

ipcMain.handle('invoices:create', async (_event, data) => {
  try {
    const validation = validateInvoice(data);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    if (!data.invoice_number) {
      return invoicesDb.createInvoiceWithNumber(data);
    }
    return invoicesDb.createInvoice(data);
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('invoices:getAll', async () => {
  try {
    return invoicesDb.getAllInvoices();
  } catch (error) {
    return [];
  }
});

ipcMain.handle('invoices:getById', async (_event, id: number) => {
  try {
    return invoicesDb.getInvoiceById(id);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('invoices:update', async (_event, id: number, data) => {
  try {
    invoicesDb.updateInvoice(id, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('invoices:delete', async (_event, id: number) => {
  try {
    invoicesDb.deleteInvoice(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('invoices:search', async (_event, filters) => {
  try {
    return invoicesDb.searchInvoices(filters);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('invoices:getLastInvoice', async () => {
  try {
    return invoicesDb.getLastInvoice();
  } catch (error) {
    return null;
  }
});

ipcMain.handle('invoices:getLastInvoiceForCustomer', async (_event, customerId: number) => {
  try {
    return invoicesDb.getLastInvoiceForCustomer(customerId);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('invoices:recalculateTotals', async (_event, invoiceId: number) => {
  try {
    invoicesDb.recalculateInvoiceTotals(invoiceId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// ----- IPC Handlers: Invoice Items -----

ipcMain.handle('invoiceItems:add', async (_event, invoiceId: number, data) => {
  const validation = validateInvoiceItem(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  return invoicesDb.addInvoiceItem(invoiceId, data);
});

ipcMain.handle('invoiceItems:getAll', async (_event, invoiceId: number) => {
  try {
    return invoicesDb.getInvoiceItems(invoiceId);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('invoiceItems:update', async (_event, id: number, data) => {
  const validation = validateInvoiceItem(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  invoicesDb.updateInvoiceItem(id, data);
  return { success: true };
});

ipcMain.handle('invoiceItems:delete', async (_event, id: number) => {
  try {
    invoicesDb.deleteInvoiceItem(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// ----- IPC Handlers: Service Types -----

ipcMain.handle('serviceTypes:create', async (_event, data) => {
  const validation = validateServiceType(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  return serviceTypesDb.createServiceType(data);
});

ipcMain.handle('serviceTypes:getAll', async () => {
  try {
    return serviceTypesDb.getAllServiceTypes();
  } catch (error) {
    return [];
  }
});

ipcMain.handle('serviceTypes:getById', async (_event, id: number) => {
  try {
    return serviceTypesDb.getServiceTypeById(id);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('serviceTypes:update', async (_event, id: number, data) => {
  const validation = validateServiceType(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  serviceTypesDb.updateServiceType(id, data);
  return { success: true };
});

ipcMain.handle('serviceTypes:delete', async (_event, id: number) => {
  try {
    return serviceTypesDb.deleteServiceType(id);
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('serviceTypes:isInUse', async (_event, id: number) => {
  try {
    return serviceTypesDb.isServiceTypeInUse(id);
  } catch (error) {
    return false;
  }
});

// ----- IPC Handlers: Customer Rates -----

ipcMain.handle('customerRates:set', async (_event, customerId: number, serviceTypeId: number, customRate: number, customDescription?: string | null) => {
  try {
    return customerRatesDb.setCustomerRate(customerId, serviceTypeId, customRate, customDescription);
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('customerRates:get', async (_event, customerId: number, serviceTypeId: number) => {
  try {
    return customerRatesDb.getCustomerRate(customerId, serviceTypeId);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('customerRates:getAllForCustomer', async (_event, customerId: number) => {
  try {
    return customerRatesDb.getAllRatesForCustomer(customerId);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('customerRates:delete', async (_event, id: number) => {
  try {
    customerRatesDb.deleteCustomerRate(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('customerRates:resolve', async (_event, customerId: number, serviceTypeId: number) => {
  try {
    return customerRatesDb.resolveRate(customerId, serviceTypeId);
  } catch (error) {
    return null;
  }
});

// ----- App lifecycle -----

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
