import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock i18next for component tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock localStorage for jsdom
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    },
    writable: true,
    configurable: true,
  });
}

// Mock navigator.language and storage
((nav) => {
  if (!('language' in (nav || {}))) {
    Object.defineProperty(nav, 'language', { value: 'it-IT', writable: true, configurable: true });
  }
  if (!('storage' in (nav || {}))) {
    const opfsStore = new Map<string, Uint8Array>();
    Object.defineProperty(nav, 'storage', {
      value: {
        getDirectory: async () => ({
          getFileHandle: async (name: string, opts?: { create?: boolean }) => {
            if (!opts?.create && !opfsStore.has(name)) throw new Error('NotFoundError');
            return {
              createWritable: async () => ({
                write: async (data: Uint8Array | ArrayBuffer) => {
                  opfsStore.set(name, data instanceof ArrayBuffer ? new Uint8Array(data) : data);
                },
                close: async () => {},
              }),
              getFile: async () => {
                const data = opfsStore.get(name);
                return new File([data || new Uint8Array()], name);
              },
            } as any;
          },
          removeEntry: async (name: string) => { opfsStore.delete(name); },
        }),
      },
      writable: true,
      configurable: true,
    });
  }
})(globalThis.navigator as any);

// Mock dbService with default empty implementations
vi.mock('../../src/services/dbService', () => ({
  default: {
    dbCreate: () => Promise.resolve({ success: true }),
    dbOpenFromFile: () => Promise.resolve({ success: true }),
    dbExport: () => Promise.resolve({ success: true }),
    settingsGet: () => Promise.resolve(null),
    settingsSave: () => Promise.resolve({ success: true }),
    settingsHas: () => Promise.resolve(false),
    settingsIncrementCounter: () => Promise.resolve(1),
    settingsGenerateInvoiceNumber: () => Promise.resolve('INV-2026-0001'),
    customersCreate: () => Promise.resolve(1),
    customersGetAll: () => Promise.resolve([]),
    customersGetById: () => Promise.resolve(null),
    customersUpdate: () => Promise.resolve({ success: true }),
    customersDelete: () => Promise.resolve({ success: true }),
    customersSearch: () => Promise.resolve([]),
    invoicesCreate: () => Promise.resolve(1),
    invoicesGetAll: () => Promise.resolve([]),
    invoicesGetById: () => Promise.resolve(null),
    invoicesGetByNumber: () => Promise.resolve(null),
    invoicesUpdate: () => Promise.resolve({ success: true }),
    invoicesDelete: () => Promise.resolve({ success: true }),
    invoicesSearch: () => Promise.resolve([]),
    invoicesGetLast: () => Promise.resolve(null),
    invoicesGetLastForCustomer: () => Promise.resolve(null),
    invoicesRecalculateTotals: () => Promise.resolve({ success: true }),
    invoiceItemsAdd: () => Promise.resolve(1),
    invoiceItemsGetAll: () => Promise.resolve([]),
    invoiceItemsUpdate: () => Promise.resolve({ success: true }),
    invoiceItemsDelete: () => Promise.resolve({ success: true }),
    serviceTypesCreate: () => Promise.resolve(1),
    serviceTypesGetAll: () => Promise.resolve([]),
    serviceTypesGetById: () => Promise.resolve(null),
    serviceTypesUpdate: () => Promise.resolve({ success: true }),
    serviceTypesDelete: () => Promise.resolve(true),
    serviceTypesIsInUse: () => Promise.resolve(false),
    customerRatesSet: () => Promise.resolve(1),
    customerRatesGet: () => Promise.resolve(null),
    customerRatesGetAllForCustomer: () => Promise.resolve([]),
    customerRatesDelete: () => Promise.resolve({ success: true }),
    customerRatesResolve: () => Promise.resolve({ rate: 0, description: null }),
  },
}));

// Mock database/backup module
vi.mock('../../src/database/backup', () => ({
  isBackupConfigured: vi.fn(() => false),
  getBackupFileName: vi.fn(() => null),
  getLastBackupTime: vi.fn(() => null),
  triggerBackup: vi.fn(() => Promise.resolve(false)),
  startBackupTimer: vi.fn(),
  stopBackupTimer: vi.fn(),
}));

// Mock database/opfs module
vi.mock('../../src/database/opfs', () => ({
  readOPFSFile: vi.fn(() => Promise.resolve(null)),
  writeOPFSFile: vi.fn(() => Promise.resolve()),
  deleteOPFSFile: vi.fn(() => Promise.resolve()),
  hasOPFSFile: vi.fn(() => Promise.resolve(false)),
  hasExistingDB: vi.fn(() => Promise.resolve(false)),
  DB_FILENAME: 'db.hkinv',
}));

// Mock database/fsa module
vi.mock('../../src/database/fsa', () => ({
  supportsFSA: () => false,
  openHKINVFile: vi.fn(() => Promise.resolve(null)),
  saveHKINVFile: vi.fn(() => Promise.resolve(null)),
  configureBackupLocation: vi.fn(() => Promise.resolve(false)),
  downloadBlob: vi.fn(),
  storeBackupHandle: vi.fn(() => Promise.resolve()),
  getStoredBackupHandle: vi.fn(() => Promise.resolve(null)),
  clearStoredBackupHandle: vi.fn(),
  getStoredBackupFileName: vi.fn(() => null),
  writeToHandle: vi.fn(() => Promise.resolve()),
  verifyHandlePermission: vi.fn(() => Promise.resolve(false)),
}));
