import * as customers from '../database/customers';
import type { Customer, CustomerInput } from '../database/customers';
import * as customerRates from '../database/customerRates';
import type { CustomerRate, CustomerRateWithServiceName } from '../database/customerRates';
import * as invoices from '../database/invoices';
import type { InvoiceInput, InvoiceItemInput, InvoiceFilters, InvoiceWithCustomer, InvoiceItem } from '../database/invoices';
import * as serviceTypes from '../database/serviceTypes';
import type { ServiceType, ServiceTypeInput } from '../database/serviceTypes';
import * as settingsDb from '../database/settings';
import type { TeacherSettings, TeacherSettingsInput } from '../database/settings';
import { getDatabase } from '../database/connection';
import { triggerBackup } from '../database/backup';
import { openHKINVFile, saveHKINVFile } from '../database/fsa';

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
    return { success: true as const };
  },
  dbOpenFromFile: async () => {
    const result = await openHKINVFile();
    if (!result) return { success: false as const };
    await import('../database/connection').then(m => m.importDatabase(result.data));
    return { success: true as const };
  },
  dbExport: async (fileName: string) => {
    const db = getDatabase();
    const data = new Uint8Array(db.export());
    await saveHKINVFile(data.buffer, fileName);
    return { success: true as const };
  },

  settingsGet: (): Promise<TeacherSettings | null> => Promise.resolve(settingsDb.getSettings()),
  settingsSave: (data: TeacherSettingsInput) => {
    settingsDb.saveSettings(data);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  settingsHas: (): Promise<boolean> => Promise.resolve(settingsDb.hasSettings()),
  settingsIncrementCounter: (): Promise<number> => Promise.resolve(settingsDb.incrementCounter()),
  settingsGenerateInvoiceNumber: (): Promise<string> => Promise.resolve(invoices.generateInvoiceNumber()),

  customersCreate: (data: CustomerInput): Promise<number> => {
    const id = customers.createCustomer(data);
    notifySaveAll();
    return Promise.resolve(id);
  },
  customersGetAll: (): Promise<Customer[]> => Promise.resolve(customers.getAllCustomers()),
  customersGetById: (id: number): Promise<Customer | null> => Promise.resolve(customers.getCustomerById(id)),
  customersUpdate: (id: number, data: Partial<CustomerInput>) => {
    customers.updateCustomer(id, data);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  customersDelete: (id: number) => {
    customers.deleteCustomer(id);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  customersSearch: (query: string): Promise<Customer[]> => Promise.resolve(customers.searchCustomers(query)),

  invoicesCreate: (data: InvoiceInput & { invoice_number?: string }): Promise<number> => {
    if (data.invoice_number && data.invoice_number.trim()) {
      const id = invoices.createInvoice(data);
      notifySaveAll();
      return Promise.resolve(id);
    }
    const id = invoices.createInvoiceWithNumber(data);
    notifySaveAll();
    return Promise.resolve(id);
  },
  invoicesGetAll: (): Promise<InvoiceWithCustomer[]> => Promise.resolve(invoices.getAllInvoices()),
  invoicesGetById: (id: number): Promise<InvoiceWithCustomer | null> => Promise.resolve(invoices.getInvoiceById(id)),
  invoicesGetByNumber: (number: string): Promise<InvoiceWithCustomer | null> => Promise.resolve(invoices.getInvoiceByNumber(number)),
  invoicesUpdate: (id: number, data: Partial<InvoiceInput & { status?: string; paid_date?: string | null; invoice_number?: string }>) => {
    invoices.updateInvoice(id, data);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  invoicesDelete: (id: number) => {
    invoices.deleteInvoice(id);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  invoicesSearch: (filters: InvoiceFilters): Promise<InvoiceWithCustomer[]> =>
    Promise.resolve(invoices.searchInvoices(filters)),
  invoicesGetLast: (): Promise<InvoiceWithCustomer | null> => Promise.resolve(invoices.getLastInvoice()),
  invoicesGetLastForCustomer: (customerId: number): Promise<InvoiceWithCustomer | null> =>
    Promise.resolve(invoices.getLastInvoiceForCustomer(customerId)),
  invoicesRecalculateTotals: (invoiceId: number) => {
    invoices.recalculateInvoiceTotals(invoiceId);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },

  invoiceItemsAdd: (invoiceId: number, data: InvoiceItemInput): Promise<number> => {
    const id = invoices.addInvoiceItem(invoiceId, data);
    notifySaveAll();
    return Promise.resolve(id);
  },
  invoiceItemsGetAll: (invoiceId: number): Promise<InvoiceItem[]> =>
    Promise.resolve(invoices.getInvoiceItems(invoiceId)),
  invoiceItemsUpdate: (id: number, data: Partial<InvoiceItemInput>) => {
    invoices.updateInvoiceItem(id, data);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  invoiceItemsDelete: (id: number) => {
    invoices.deleteInvoiceItem(id);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },

  serviceTypesCreate: (data: ServiceTypeInput): Promise<number> => {
    const id = serviceTypes.createServiceType(data);
    notifySaveAll();
    return Promise.resolve(id);
  },
  serviceTypesGetAll: (): Promise<ServiceType[]> => Promise.resolve(serviceTypes.getAllServiceTypes()),
  serviceTypesGetById: (id: number): Promise<ServiceType | null> =>
    Promise.resolve(serviceTypes.getServiceTypeById(id)),
  serviceTypesUpdate: (id: number, data: Partial<ServiceTypeInput>) => {
    serviceTypes.updateServiceType(id, data);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  serviceTypesDelete: (id: number): Promise<boolean> => {
    const ok = serviceTypes.deleteServiceType(id);
    if (ok) notifySaveAll();
    return Promise.resolve(ok);
  },
  serviceTypesIsInUse: (id: number): Promise<boolean> =>
    Promise.resolve(serviceTypes.isServiceTypeInUse(id)),

  customerRatesSet: (
    customerId: number,
    serviceTypeId: number,
    customRate: number,
    customDescription?: string | null
  ): Promise<number> => {
    const id = customerRates.setCustomerRate(customerId, serviceTypeId, customRate, customDescription);
    notifySaveAll();
    return Promise.resolve(id);
  },
  customerRatesGet: (customerId: number, serviceTypeId: number): Promise<CustomerRate | null> =>
    Promise.resolve(customerRates.getCustomerRate(customerId, serviceTypeId)),
  customerRatesGetAllForCustomer: (customerId: number): Promise<CustomerRateWithServiceName[]> =>
    Promise.resolve(customerRates.getAllRatesForCustomer(customerId)),
  customerRatesDelete: (id: number) => {
    customerRates.deleteCustomerRate(id);
    notifySaveAll();
    return Promise.resolve({ success: true as const });
  },
  customerRatesResolve: (customerId: number, serviceTypeId: number): Promise<{ rate: number; description: string | null }> =>
    Promise.resolve(customerRates.resolveRate(customerId, serviceTypeId)),
};

export default dbService;
