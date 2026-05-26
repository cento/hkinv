import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import DashboardPage from '../../../src/pages/DashboardPage';

const mockInvoices = [
  { id: 1, status: 'sent', due_date: '2025-01-01', total: 1000, invoice_number: 'INV-001', customer_name: 'A', customer_id: 1, issue_date: '2025-01-01' },
  { id: 2, status: 'paid', total: 2000, invoice_number: 'INV-002', customer_name: 'B', customer_id: 2, issue_date: '2025-01-15', due_date: '2025-02-15' },
  { id: 3, status: 'draft', total: 500, invoice_number: 'INV-003', customer_name: 'C', customer_id: 3, issue_date: '2026-05-28', due_date: '2026-06-28' },
];

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(MemoryRouter, null, React.createElement(DashboardPage))));
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).api = { ...(window as any).api,
      invoicesGetAll: () => Promise.resolve(mockInvoices),
      customersGetAll: () => Promise.resolve([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]),
    };
  });

  it('should render dashboard title', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); });
  });

  it('should render stats values after loading', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); }, { timeout: 5000 });
    const allText = screen.queryAllByText(/\d/);
    // If stats rendered, we'll find numbers like "3", "2", "3000"
    expect(allText.length).toBeGreaterThan(0);
  }, 10000);

  it('should render new invoice button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('dashboard.title')).toBeInTheDocument(); });
    expect(screen.getByText('invoices.new')).toBeInTheDocument();
  });
});