/**
 * Typed IPC wrappers that use the window.api exposed in preload.ts
 */
import type { ElectronAPI } from '../types/api';

const windowApi = window.api as ElectronAPI;

export const api: ElectronAPI = {
  // Database
  dbCreate: (dbPath: string) => windowApi.dbCreate(dbPath),
  dbOpen: (dbPath: string) => windowApi.dbOpen(dbPath),
  dbClose: () => windowApi.dbClose(),
  dbBackup: () => windowApi.dbBackup(),
  dbIsOpen: () => windowApi.dbIsOpen(),
  dbGetSchemaVersion: () => windowApi.dbGetSchemaVersion(),

  // Dialogs
  dialogOpenFile: () => windowApi.dialogOpenFile(),
  dialogSaveFile: (name: string) => windowApi.dialogSaveFile(name),
  dialogSavePDF: (name: string) => windowApi.dialogSavePDF(name),
  fileWriteBinary: (filePath: string, data: number[]) => windowApi.fileWriteBinary(filePath, data),

  // Settings
  settingsGet: () => windowApi.settingsGet(),
  settingsSave: (data: Record<string, unknown>) => windowApi.settingsSave(data),
  settingsHas: () => windowApi.settingsHas(),
  settingsIncrementCounter: () => windowApi.settingsIncrementCounter(),
  settingsGenerateInvoiceNumber: () => windowApi.settingsGenerateInvoiceNumber(),

  // Customers
  customersCreate: (data: Record<string, unknown>) => windowApi.customersCreate(data),
  customersGetAll: () => windowApi.customersGetAll(),
  customersGetById: (id: number) => windowApi.customersGetById(id),
  customersUpdate: (id: number, data: Record<string, unknown>) => windowApi.customersUpdate(id, data),
  customersDelete: (id: number) => windowApi.customersDelete(id),
  customersSearch: (query: string) => windowApi.customersSearch(query),

  // Invoices
  invoicesCreate: (data: Record<string, unknown>) => windowApi.invoicesCreate(data),
  invoicesGetAll: () => windowApi.invoicesGetAll(),
  invoicesGetById: (id: number) => windowApi.invoicesGetById(id),
  invoicesUpdate: (id: number, data: Record<string, unknown>) => windowApi.invoicesUpdate(id, data),
  invoicesDelete: (id: number) => windowApi.invoicesDelete(id),
  invoicesSearch: (filters: Record<string, unknown>) => windowApi.invoicesSearch(filters),
  invoicesGetLast: () => windowApi.invoicesGetLast(),
  invoicesGetLastForCustomer: (customerId: number) => windowApi.invoicesGetLastForCustomer(customerId),
  invoicesRecalculateTotals: (invoiceId: number) => windowApi.invoicesRecalculateTotals(invoiceId),

  // Invoice Items
  invoiceItemsAdd: (invoiceId: number, data: Record<string, unknown>) => windowApi.invoiceItemsAdd(invoiceId, data),
  invoiceItemsGetAll: (invoiceId: number) => windowApi.invoiceItemsGetAll(invoiceId),
  invoiceItemsUpdate: (id: number, data: Record<string, unknown>) => windowApi.invoiceItemsUpdate(id, data),
  invoiceItemsDelete: (id: number) => windowApi.invoiceItemsDelete(id),

  // Service Types
  serviceTypesCreate: (data: Record<string, unknown>) => windowApi.serviceTypesCreate(data),
  serviceTypesGetAll: () => windowApi.serviceTypesGetAll(),
  serviceTypesGetById: (id: number) => windowApi.serviceTypesGetById(id),
  serviceTypesUpdate: (id: number, data: Record<string, unknown>) => windowApi.serviceTypesUpdate(id, data),
  serviceTypesDelete: (id: number) => windowApi.serviceTypesDelete(id),
  serviceTypesIsInUse: (id: number) => windowApi.serviceTypesIsInUse(id),

  // Customer Rates
  customerRatesSet: (customerId: number, serviceTypeId: number, customRate: number, customDescription?: string | null) =>
    windowApi.customerRatesSet(customerId, serviceTypeId, customRate, customDescription),
  customerRatesGet: (customerId: number, serviceTypeId: number) => windowApi.customerRatesGet(customerId, serviceTypeId),
  customerRatesGetAllForCustomer: (customerId: number) => windowApi.customerRatesGetAllForCustomer(customerId),
  customerRatesDelete: (id: number) => windowApi.customerRatesDelete(id),
  customerRatesResolve: (customerId: number, serviceTypeId: number) => windowApi.customerRatesResolve(customerId, serviceTypeId),
};

export default api;