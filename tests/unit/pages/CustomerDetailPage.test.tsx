import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import CustomerDetailPage from '../../../src/pages/CustomerDetailPage';

vi.mock('../../../src/services/dbService', () => ({
  default: {
    customersGetById: vi.fn().mockResolvedValue({
      id: 1, name: 'School A', address: '15/F Central', contact_person: 'Paola',
      email: 'paola@school.hk', phone: '+852 1234', notes: 'Note',
    }),
    invoicesSearch: vi.fn().mockResolvedValue([
      { id: 1, invoice_number: 'INV-001', issue_date: '2026-06-01', total: 1000, status: 'paid' },
    ]),
    customersUpdate: vi.fn().mockResolvedValue({ success: true }),
    customerRatesGetAllForCustomer: vi.fn().mockResolvedValue([]),
    serviceTypesGetAll: vi.fn().mockResolvedValue([]),
  },
}));

function renderPage() {
  return render(
    React.createElement(AppProvider, null,
      React.createElement(MemoryRouter, { initialEntries: ['/customers/1'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/customers/:id', element: React.createElement(CustomerDetailPage) })
        )
      )
    )
  );
}

describe('CustomerDetailPage', () => {
  it('renders customer details', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('School A')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('15/F Central')).toBeInTheDocument();
    expect(screen.getByText('paola@school.hk')).toBeInTheDocument();
    expect(screen.getByText('+852 1234')).toBeInTheDocument();
  });

  it('shows invoice count in tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/invoices\.title/)).toBeInTheDocument(), { timeout: 5000 });
    // Click the invoice tab to see invoice list
    const invoiceTab = screen.getByText(/invoices\.title.*1/);
    fireEvent.click(invoiceTab);
    await waitFor(() => expect(screen.getByText('INV-001')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('shows edit button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('common.edit')).toBeInTheDocument(), { timeout: 5000 });
  });
});
