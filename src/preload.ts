import { contextBridge, ipcRenderer } from 'electron';

const api = {
// Database
  dbCreate: (dbPath: string) => ipcRenderer.invoke('db:create', dbPath),
  dbOpen: (dbPath: string) => ipcRenderer.invoke('db:open', dbPath),
  dbClose: () => ipcRenderer.invoke('db:close'),
  dbBackup: () => ipcRenderer.invoke('db:backup'),
  dbIsOpen: () => ipcRenderer.invoke('db:isOpen'),
  dbGetSchemaVersion: () => ipcRenderer.invoke('db:getSchemaVersion'),

  // Dialogs
  dialogOpenFile: () => ipcRenderer.invoke('dialog:openFile'),
  dialogSaveFile: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  dialogSavePDF: (defaultName: string) => ipcRenderer.invoke('dialog:savePDF', defaultName),
  fileWriteBinary: (filePath: string, data: number[]) => ipcRenderer.invoke('file:writeBinary', filePath, data),
  dialogImportFile: (defaultName: string) => ipcRenderer.invoke('dialog:importFile', defaultName),

  // Settings
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSave: (data: unknown) => ipcRenderer.invoke('settings:save', data),
  settingsHas: () => ipcRenderer.invoke('settings:has'),
  settingsIncrementCounter: () => ipcRenderer.invoke('settings:incrementCounter'),
  settingsGenerateInvoiceNumber: () => ipcRenderer.invoke('settings:generateInvoiceNumber'),

  // Customers
  customersCreate: (data: unknown) => ipcRenderer.invoke('customers:create', data),
  customersGetAll: () => ipcRenderer.invoke('customers:getAll'),
  customersGetById: (id: number) => ipcRenderer.invoke('customers:getById', id),
  customersUpdate: (id: number, data: unknown) => ipcRenderer.invoke('customers:update', id, data),
  customersDelete: (id: number) => ipcRenderer.invoke('customers:delete', id),
  customersSearch: (query: string) => ipcRenderer.invoke('customers:search', query),

  // Invoices
  invoicesCreate: (data: unknown) => ipcRenderer.invoke('invoices:create', data),
  invoicesGetAll: () => ipcRenderer.invoke('invoices:getAll'),
  invoicesGetById: (id: number) => ipcRenderer.invoke('invoices:getById', id),
  invoicesUpdate: (id: number, data: unknown) => ipcRenderer.invoke('invoices:update', id, data),
  invoicesDelete: (id: number) => ipcRenderer.invoke('invoices:delete', id),
  invoicesSearch: (filters: unknown) => ipcRenderer.invoke('invoices:search', filters),
  invoicesGetLast: () => ipcRenderer.invoke('invoices:getLastInvoice'),
  invoicesGetLastForCustomer: (customerId: number) => ipcRenderer.invoke('invoices:getLastInvoiceForCustomer', customerId),
  invoicesRecalculateTotals: (invoiceId: number) => ipcRenderer.invoke('invoices:recalculateTotals', invoiceId),

  // Invoice Items
  invoiceItemsAdd: (invoiceId: number, data: unknown) => ipcRenderer.invoke('invoiceItems:add', invoiceId, data),
  invoiceItemsGetAll: (invoiceId: number) => ipcRenderer.invoke('invoiceItems:getAll', invoiceId),
  invoiceItemsUpdate: (id: number, data: unknown) => ipcRenderer.invoke('invoiceItems:update', id, data),
  invoiceItemsDelete: (id: number) => ipcRenderer.invoke('invoiceItems:delete', id),

  // Service Types
  serviceTypesCreate: (data: unknown) => ipcRenderer.invoke('serviceTypes:create', data),
  serviceTypesGetAll: () => ipcRenderer.invoke('serviceTypes:getAll'),
  serviceTypesGetById: (id: number) => ipcRenderer.invoke('serviceTypes:getById', id),
  serviceTypesUpdate: (id: number, data: unknown) => ipcRenderer.invoke('serviceTypes:update', id, data),
  serviceTypesDelete: (id: number) => ipcRenderer.invoke('serviceTypes:delete', id),
  serviceTypesIsInUse: (id: number) => ipcRenderer.invoke('serviceTypes:isInUse', id),

  // Customer Rates
  customerRatesSet: (customerId: number, serviceTypeId: number, customRate: number, customDescription?: string | null) =>
    ipcRenderer.invoke('customerRates:set', customerId, serviceTypeId, customRate, customDescription),
  customerRatesGet: (customerId: number, serviceTypeId: number) => ipcRenderer.invoke('customerRates:get', customerId, serviceTypeId),
  customerRatesGetAllForCustomer: (customerId: number) => ipcRenderer.invoke('customerRates:getAllForCustomer', customerId),
  customerRatesDelete: (id: number) => ipcRenderer.invoke('customerRates:delete', id),
  customerRatesResolve: (customerId: number, serviceTypeId: number) => ipcRenderer.invoke('customerRates:resolve', customerId, serviceTypeId),
};

contextBridge.exposeInMainWorld('api', api);

