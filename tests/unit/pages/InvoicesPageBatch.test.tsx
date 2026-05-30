import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import InvoicesPage from '../../../src/pages/InvoicesPage';

const { mockInvoices } = vi.hoisted(() => ({
  mockInvoices: [
    { id: 1, status: 'draft', total: 1000, invoice_number: 'INV-001', customer_name: 'A', customer_id: 1, issue_date: '2026-06-01', due_date: '2026-07-01' },
    { id: 2, status: 'sent', total: 2000, invoice_number: 'INV-002', customer_name: 'B', customer_id: 2, issue_date: '2026-06-15', due_date: '2026-07-15' },
  ],
}));

vi.mock('../../../src/services/dbService', () => ({
  default: {
    invoicesSearch: vi.fn().mockResolvedValue(mockInvoices),
    invoicesGetAll: vi.fn().mockResolvedValue(mockInvoices),
    customersGetAll: vi.fn().mockResolvedValue([]),
    invoicesUpdate: vi.fn().mockResolvedValue({ success: true }),
    invoicesGetById: vi.fn().mockResolvedValue(null),
    invoicesDelete: vi.fn().mockResolvedValue({ success: true }),
    invoicesGetByNumber: vi.fn().mockResolvedValue(null),
    settingsGet: vi.fn().mockResolvedValue(null),
    settingsHas: vi.fn().mockResolvedValue(false),
    settingsSave: vi.fn().mockResolvedValue({ success: true }),
    settingsIncrementCounter: vi.fn().mockResolvedValue(1),
    settingsGenerateInvoiceNumber: vi.fn().mockResolvedValue('INV-2026-0001'),
    customersCreate: vi.fn().mockResolvedValue(1),
    customersUpdate: vi.fn().mockResolvedValue({ success: true }),
    customersDelete: vi.fn().mockResolvedValue({ success: true }),
    customersSearch: vi.fn().mockResolvedValue([]),
    invoicesCreate: vi.fn().mockResolvedValue(1),
    invoicesRecalculateTotals: vi.fn().mockResolvedValue({ success: true }),
    invoiceItemsAdd: vi.fn().mockResolvedValue(1),
    invoiceItemsGetAll: vi.fn().mockResolvedValue([]),
    invoiceItemsUpdate: vi.fn().mockResolvedValue({ success: true }),
    invoiceItemsDelete: vi.fn().mockResolvedValue({ success: true }),
    serviceTypesCreate: vi.fn().mockResolvedValue(1),
    serviceTypesGetAll: vi.fn().mockResolvedValue([]),
    serviceTypesGetById: vi.fn().mockResolvedValue(null),
    serviceTypesUpdate: vi.fn().mockResolvedValue({ success: true }),
    serviceTypesDelete: vi.fn().mockResolvedValue(true),
    serviceTypesIsInUse: vi.fn().mockResolvedValue(false),
    customerRatesSet: vi.fn().mockResolvedValue(1),
    customerRatesGet: vi.fn().mockResolvedValue(null),
    customerRatesGetAllForCustomer: vi.fn().mockResolvedValue([]),
    customerRatesDelete: vi.fn().mockResolvedValue({ success: true }),
    customerRatesResolve: vi.fn().mockResolvedValue({ rate: 0, description: null }),
    dbCreate: vi.fn().mockResolvedValue({ success: true }),
    dbOpenFromFile: vi.fn().mockResolvedValue({ success: true }),
    dbExport: vi.fn().mockResolvedValue({ success: true }),
  },
}));

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(MemoryRouter, null, React.createElement(InvoicesPage))));
}

describe('InvoicesPage batch operations', () => {
  it('renders invoice list', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('INV-001')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('INV-002')).toBeInTheDocument();
  });

  it('shows hide paid button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('invoices.hidePaid')).toBeInTheDocument(), { timeout: 5000 });
  });

  it('renders new invoice button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('invoices.new')).toBeInTheDocument(), { timeout: 5000 });
  });
});
