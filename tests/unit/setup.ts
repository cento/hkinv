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

// Mock navigator.language
if (typeof globalThis.navigator === 'undefined' || !('language' in globalThis.navigator)) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: 'it-IT' },
    writable: true,
    configurable: true,
  });
}

// Mock window.api for tests that need IPC without Electron
if (typeof window !== 'undefined' && !(window as any).api) {
  (window as any).api = {
    dbIsOpen: () => Promise.resolve(false),
    dbBackup: () => Promise.resolve({ success: true, backupPath: '' }),
    settingsHas: () => Promise.resolve(false),
    settingsGet: () => Promise.resolve(null),
    settingsSave: () => Promise.resolve({ success: true }),
    customersGetAll: () => Promise.resolve([]),
    customersGetById: () => Promise.resolve(null),
    invoicesGetAll: () => Promise.resolve([]),
    invoicesSearch: () => Promise.resolve([]),
    invoicesGetLast: () => Promise.resolve(null),
    invoicesCreate: () => Promise.resolve(1),
    invoicesGetById: () => Promise.resolve(null),
    serviceTypesGetAll: () => Promise.resolve([]),
    invoiceItemsGetAll: () => Promise.resolve([]),
    dialogSaveFile: () => Promise.resolve({ canceled: true }),
    dialogSavePDF: () => Promise.resolve({ canceled: true }),
    dialogOpenFile: () => Promise.resolve({ canceled: true }),
    fileWriteBinary: () => Promise.resolve({ success: true }),
  };
}
