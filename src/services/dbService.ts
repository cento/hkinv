import * as customers from '../database/customers';
import * as customerRates from '../database/customerRates';
import * as invoices from '../database/invoices';
import * as serviceTypes from '../database/serviceTypes';
import * as settingsDb from '../database/settings';
import { saveDatabase, getDatabase } from '../database/connection';
import { triggerBackup } from '../database/backup';
import { openHKINVFile, saveHKINVFile, downloadBlob } from '../database/fsa';

let backupTimer: ReturnType<typeof setTimeout> | null = null;

function notifySaveAll() {
  import('../database/connection').then(m => m.notifySave());
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    triggerBackup(true).catch(() => {});
  }, 2000);
}

const dbService = {
  dbCreate: async () => {
    await import('../database/connection').then(m => m.createDatabase());
    return { success: true };
  },
  dbOpenFromFile: async () => {
    const result = await openHKINVFile();
    if (!result) return { success: false };
    await import('../database/connection').then(m => m.importDatabase(result.data));
    return { success: true };
  },
  dbExport: async (fileName: string) => {
    const db = getDatabase();
    const data = new Uint8Array(db.export());
    await saveHKINVFile(data.buffer, fileName);
    return { success: true };
  },

  settingsGet: () => Promise.resolve(settingsDb.getSettings()),
  settingsSave: (data: Record<string, unknown>) => {
    settingsDb.saveSettings(data as any);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  settingsHas: () => Promise.resolve(settingsDb.hasSettings()),
  settingsIncrementCounter: () => Promise.resolve(settingsDb.incrementCounter()),
  settingsGenerateInvoiceNumber: () => Promise.resolve(invoices.generateInvoiceNumber()),

  customersCreate: (data: Record<string, unknown>) => {
    const id = customers.createCustomer(data as any);
    notifySaveAll();
    return Promise.resolve(id);
  },
  customersGetAll: () => Promise.resolve(customers.getAllCustomers()),
  customersGetById: (id: number) => Promise.resolve(customers.getCustomerById(id)),
  customersUpdate: (id: number, data: Record<string, unknown>) => {
    customers.updateCustomer(id, data as any);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  customersDelete: (id: number) => {
    customers.deleteCustomer(id);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  customersSearch: (query: string) => Promise.resolve(customers.searchCustomers(query)),

  invoicesCreate: (data: Record<string, unknown>) => {
    if (data.invoice_number && typeof data.invoice_number === 'string' && data.invoice_number.trim()) {
      const id = invoices.createInvoice(data as any);
      notifySaveAll();
      return Promise.resolve(id);
    }
    const id = invoices.createInvoiceWithNumber(data as any);
    notifySaveAll();
    return Promise.resolve(id);
  },
  invoicesGetAll: () => Promise.resolve(invoices.getAllInvoices()),
  invoicesGetById: (id: number) => Promise.resolve(invoices.getInvoiceById(id)),
  invoicesGetByNumber: (number: string) => Promise.resolve(invoices.getInvoiceByNumber(number)),
  invoicesUpdate: (id: number, data: Record<string, unknown>) => {
    invoices.updateInvoice(id, data as any);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  invoicesDelete: (id: number) => {
    invoices.deleteInvoice(id);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  invoicesSearch: (filters: Record<string, unknown>) =>
    Promise.resolve(invoices.searchInvoices(filters as any)),
  invoicesGetLast: () => Promise.resolve(invoices.getLastInvoice()),
  invoicesGetLastForCustomer: (customerId: number) =>
    Promise.resolve(invoices.getLastInvoiceForCustomer(customerId)),
  invoicesRecalculateTotals: (invoiceId: number) => {
    invoices.recalculateInvoiceTotals(invoiceId);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },

  invoiceItemsAdd: (invoiceId: number, data: Record<string, unknown>) => {
    const id = invoices.addInvoiceItem(invoiceId, data as any);
    notifySaveAll();
    return Promise.resolve(id);
  },
  invoiceItemsGetAll: (invoiceId: number) =>
    Promise.resolve(invoices.getInvoiceItems(invoiceId)),
  invoiceItemsUpdate: (id: number, data: Record<string, unknown>) => {
    invoices.updateInvoiceItem(id, data as any);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  invoiceItemsDelete: (id: number) => {
    invoices.deleteInvoiceItem(id);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },

  serviceTypesCreate: (data: Record<string, unknown>) => {
    const id = serviceTypes.createServiceType(data as any);
    notifySaveAll();
    return Promise.resolve(id);
  },
  serviceTypesGetAll: () => Promise.resolve(serviceTypes.getAllServiceTypes()),
  serviceTypesGetById: (id: number) =>
    Promise.resolve(serviceTypes.getServiceTypeById(id)),
  serviceTypesUpdate: (id: number, data: Record<string, unknown>) => {
    serviceTypes.updateServiceType(id, data as any);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  serviceTypesDelete: (id: number) => {
    const ok = serviceTypes.deleteServiceType(id);
    if (ok) notifySaveAll();
    return Promise.resolve(ok);
  },
  serviceTypesIsInUse: (id: number) =>
    Promise.resolve(serviceTypes.isServiceTypeInUse(id)),

  customerRatesSet: (
    customerId: number,
    serviceTypeId: number,
    customRate: number,
    customDescription?: string | null
  ) => {
    const id = customerRates.setCustomerRate(customerId, serviceTypeId, customRate, customDescription);
    notifySaveAll();
    return Promise.resolve(id);
  },
  customerRatesGet: (customerId: number, serviceTypeId: number) =>
    Promise.resolve(customerRates.getCustomerRate(customerId, serviceTypeId)),
  customerRatesGetAllForCustomer: (customerId: number) =>
    Promise.resolve(customerRates.getAllRatesForCustomer(customerId)),
  customerRatesDelete: (id: number) => {
    customerRates.deleteCustomerRate(id);
    notifySaveAll();
    return Promise.resolve({ success: true });
  },
  customerRatesResolve: (customerId: number, serviceTypeId: number) =>
    Promise.resolve(customerRates.resolveRate(customerId, serviceTypeId)),
};

export default dbService;
