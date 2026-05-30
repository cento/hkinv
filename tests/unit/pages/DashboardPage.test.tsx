import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import DashboardPage from '../../../src/pages/DashboardPage';

const { mockInvoices } = vi.hoisted(() => ({
  mockInvoices: [
    { id: 1, status: 'sent', due_date: '2025-01-01', total: 1000, invoice_number: 'INV-001', customer_name: 'A', customer_id: 1, issue_date: '2025-01-01' },
    { id: 2, status: 'paid', total: 2000, invoice_number: 'INV-002', customer_name: 'B', customer_id: 2, issue_date: '2025-01-15', due_date: '2025-02-15' },
    { id: 3, status: 'draft', total: 500, invoice_number: 'INV-003', customer_name: 'C', customer_id: 3, issue_date: '2026-05-28', due_date: '2026-06-28' },
    { id: 4, status: 'cancelled', total: 0, invoice_number: 'INV-004', customer_name: 'D', customer_id: 4, issue_date: '2026-05-01', due_date: '2026-06-01' },
  ],
}));

vi.mock('../../../src/services/dbService', () => ({
  default: {
    invoicesGetAll: vi.fn().mockResolvedValue(mockInvoices),
    customersGetAll: vi.fn().mockResolvedValue([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]),
    settingsGet: () => Promise.resolve(null),
    settingsHas: () => Promise.resolve(false),
    settingsSave: () => Promise.resolve({ success: true }),
    settingsIncrementCounter: () => Promise.resolve(1),
    settingsGenerateInvoiceNumber: () => Promise.resolve('INV-2026-0001'),
    customersCreate: () => Promise.resolve(1),
    customersGetById: () => Promise.resolve(null),
    customersUpdate: () => Promise.resolve({ success: true }),
    customersDelete: () => Promise.resolve({ success: true }),
    customersSearch: () => Promise.resolve([]),
    invoicesCreate: () => Promise.resolve(1),
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
    dbCreate: () => Promise.resolve({ success: true }),
    dbOpenFromFile: () => Promise.resolve({ success: true }),
    dbExport: () => Promise.resolve({ success: true }),
  },
}));

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(MemoryRouter, null, React.createElement(DashboardPage))));
}

describe('DashboardPage', () => {
  it('should render dashboard title', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); });
  });

  it('should render stats values after loading', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); }, { timeout: 5000 });
    const allText = screen.queryAllByText(/\d/);
    expect(allText.length).toBeGreaterThan(0);
  }, 10000);

  it('should render new invoice button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); });
    expect(screen.getByText('invoices.new')).toBeInTheDocument();
  });

  it('should show draft label and total count includes cancelled', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); }, { timeout: 5000 });
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('invoices.draft')).toBeInTheDocument();
  }, 10000);
});
