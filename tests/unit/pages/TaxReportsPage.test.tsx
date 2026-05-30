import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import TaxReportsPage from '../../../src/pages/TaxReportsPage';

vi.mock('../../../src/services/dbService', () => ({
  default: {
    invoicesGetAll: vi.fn().mockResolvedValue([
      { id: 1, status: 'paid', paid_date: '2026-06-15', total: 1000, customer_name: 'School A', customer_id: 1, invoice_number: 'INV-001', issue_date: '2026-06-01', due_date: '2026-07-01' },
      { id: 2, status: 'paid', paid_date: '2026-07-20', total: 2000, customer_name: 'School B', customer_id: 2, invoice_number: 'INV-002', issue_date: '2026-07-01', due_date: '2026-08-01' },
      { id: 3, status: 'draft', total: 500, customer_name: 'School A', customer_id: 1, invoice_number: 'INV-003', issue_date: '2026-08-01', due_date: '2026-09-01' },
    ]),
    settingsGet: vi.fn().mockResolvedValue({
      teacher_name: 'Test Teacher', teacher_address: 'HK', br_number: 'BR123',
    }),
  },
}));

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(MemoryRouter, null, React.createElement(TaxReportsPage))));
}

describe('TaxReportsPage', () => {
  it('renders title and stats', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('pdf.taxReport')).toBeInTheDocument(), { timeout: 5000 });
    const amounts = screen.getAllByText(/3000\.00/);
    expect(amounts.length).toBeGreaterThanOrEqual(1);
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  it('shows customer breakdown', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('School A').length).toBeGreaterThanOrEqual(1), { timeout: 5000 });
    expect(screen.getAllByText('School B').length).toBeGreaterThanOrEqual(1);
  });

  it('renders export buttons', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('CSV')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('invoices.exportPdf')).toBeInTheDocument();
  });
});
