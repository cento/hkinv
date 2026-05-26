import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import InvoiceFilters from '../../../src/components/InvoiceFilters';

const defaultFilters = {
  dateFrom: '', dateTo: '', customerId: null,
  status: '', invoiceNumberSearch: '',
  minAmount: '', maxAmount: '',
};

describe('InvoiceFilters', () => {
  const onChange = vi.fn();
  const customers = [{ id: 1, name: 'Test School' }];

  beforeEach(() => { vi.clearAllMocks(); });

  it('should render all filter inputs', () => {
    render(React.createElement(InvoiceFilters, { values: defaultFilters, onChange, customers }));
    expect(screen.getByLabelText(/filterDateFrom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filterDateTo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filterNumber/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filterPriceMin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filterPriceMax/i)).toBeInTheDocument();
  });

  it('should call onChange when dateFrom changes', () => {
    render(React.createElement(InvoiceFilters, { values: defaultFilters, onChange, customers }));
    fireEvent.change(screen.getByLabelText(/filterDateFrom/i), { target: { value: '2026-05-01' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dateFrom: '2026-05-01' }));
  });

  it('should show clear button when filters are active', () => {
    const activeFilters = { ...defaultFilters, dateFrom: '2026-05-01' };
    render(React.createElement(InvoiceFilters, { values: activeFilters, onChange, customers }));
    const clearBtn = screen.queryByText(/filterClear/i);
    expect(clearBtn).toBeInTheDocument();
  });

  it('should NOT show clear button when no filters active', () => {
    render(React.createElement(InvoiceFilters, { values: defaultFilters, onChange, customers }));
    expect(screen.queryByText(/filterClear/i)).not.toBeInTheDocument();
  });

  it('should call onChange with default filters on clear', () => {
    const activeFilters = { ...defaultFilters, status: 'draft' };
    render(React.createElement(InvoiceFilters, { values: activeFilters, onChange, customers }));
    fireEvent.click(screen.getByText(/filterClear/i));
    expect(onChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('should update minAmount on input change', () => {
    render(React.createElement(InvoiceFilters, { values: defaultFilters, onChange, customers }));
    fireEvent.change(screen.getByLabelText(/filterPriceMin/i), { target: { value: '100' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ minAmount: '100' }));
  });

  it('should render customer autocomplete', () => {
    render(React.createElement(InvoiceFilters, { values: defaultFilters, onChange, customers }));
    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
  });
});
