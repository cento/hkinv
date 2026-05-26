export interface ElectronAPI {
  // Database
  dbCreate: (dbPath: string) => Promise<{ success: boolean; error?: string }>;
  dbOpen: (dbPath: string) => Promise<{ success: boolean; error?: string }>;
  dbClose: () => Promise<{ success: boolean }>;
  dbBackup: () => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  dbIsOpen: () => Promise<boolean>;
  dbGetSchemaVersion: () => Promise<number>;

  // Dialogs
  dialogOpenFile: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
  dialogSaveFile: (defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>;
  dialogSavePDF: (defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>;
  fileWriteBinary: (filePath: string, data: number[]) => Promise<{ success: boolean; error?: string }>;
  dialogImportFile: (defaultName: string) => Promise<{ canceled: boolean; success?: boolean; filePath?: string; error?: string }>;

  // Settings
  settingsGet: () => Promise<Record<string, unknown> | null>;
  settingsSave: (data: Record<string, unknown>) => Promise<{ success: boolean }>;
  settingsHas: () => Promise<boolean>;
  settingsIncrementCounter: () => Promise<number>;
  settingsGenerateInvoiceNumber: () => Promise<string>;

  // Customers
  customersCreate: (data: Record<string, unknown>) => Promise<number>;
  customersGetAll: () => Promise<unknown[]>;
  customersGetById: (id: number) => Promise<unknown | null>;
  customersUpdate: (id: number, data: Record<string, unknown>) => Promise<{ success: boolean }>;
  customersDelete: (id: number) => Promise<{ success: boolean }>;
  customersSearch: (query: string) => Promise<unknown[]>;

  // Invoices
  invoicesCreate: (data: Record<string, unknown>) => Promise<number>;
  invoicesGetAll: () => Promise<unknown[]>;
  invoicesGetById: (id: number) => Promise<unknown | null>;
  invoicesUpdate: (id: number, data: Record<string, unknown>) => Promise<{ success: boolean }>;
  invoicesDelete: (id: number) => Promise<{ success: boolean }>;
  invoicesSearch: (filters: Record<string, unknown>) => Promise<unknown[]>;
  invoicesGetLast: () => Promise<unknown | null>;
  invoicesGetLastForCustomer: (customerId: number) => Promise<unknown | null>;
  invoicesRecalculateTotals: (invoiceId: number) => Promise<{ success: boolean }>;

  // Invoice Items
  invoiceItemsAdd: (invoiceId: number, data: Record<string, unknown>) => Promise<number>;
  invoiceItemsGetAll: (invoiceId: number) => Promise<unknown[]>;
  invoiceItemsUpdate: (id: number, data: Record<string, unknown>) => Promise<{ success: boolean }>;
  invoiceItemsDelete: (id: number) => Promise<{ success: boolean }>;

  // Service Types
  serviceTypesCreate: (data: Record<string, unknown>) => Promise<number>;
  serviceTypesGetAll: () => Promise<unknown[]>;
  serviceTypesGetById: (id: number) => Promise<unknown | null>;
  serviceTypesUpdate: (id: number, data: Record<string, unknown>) => Promise<{ success: boolean }>;
  serviceTypesDelete: (id: number) => Promise<boolean>;
  serviceTypesIsInUse: (id: number) => Promise<boolean>;

  // Customer Rates
  customerRatesSet: (customerId: number, serviceTypeId: number, customRate: number, customDescription?: string | null) => Promise<number>;
  customerRatesGet: (customerId: number, serviceTypeId: number) => Promise<unknown | null>;
  customerRatesGetAllForCustomer: (customerId: number) => Promise<unknown[]>;
  customerRatesDelete: (id: number) => Promise<{ success: boolean }>;
  customerRatesResolve: (customerId: number, serviceTypeId: number) => Promise<{ rate: number; description: string | null }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
