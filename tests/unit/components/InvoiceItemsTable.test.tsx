import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import InvoiceItemsTable from '../../../src/components/InvoiceItemsTable';
import type { InvoiceItemRow } from '../../../src/components/InvoiceItemsTable';

vi.mock('../../../src/services/dbService', () => ({
  default: {
    serviceTypesGetAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Lesson', default_rate: 500, default_hours: 1 },
    ]),
    customerRatesResolve: vi.fn().mockResolvedValue({ rate: 450, description: 'Discounted' }),
  },
}));

const baseItems: InvoiceItemRow[] = [
  { tempId: 1, description: 'Test lesson', lesson_date: '2026-06-01', hours: 2, rate: 500, amount: 1000 },
];

describe('InvoiceItemsTable', () => {
  it('renders empty state when no items', () => {
    render(React.createElement(InvoiceItemsTable, {
      items: [], onChange: vi.fn(), customerId: null,
    }));
    expect(screen.getByText(/common\.noData/)).toBeInTheDocument();
  });

  it('renders items table with rows', () => {
    render(React.createElement(InvoiceItemsTable, {
      items: baseItems, onChange: vi.fn(), customerId: null,
    }));
    expect(screen.getByDisplayValue('Test lesson')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    expect(screen.getByText('HK$1,000.00')).toBeInTheDocument();
  });

  it('calls onChange when adding item', () => {
    const onChange = vi.fn();
    render(React.createElement(InvoiceItemsTable, {
      items: [], onChange, customerId: null,
    }));
    fireEvent.click(screen.getByText('invoices.addItem'));
    expect(onChange).toHaveBeenCalledOnce();
    const newItems = onChange.mock.calls[0][0] as InvoiceItemRow[];
    expect(newItems).toHaveLength(1);
    expect(newItems[0].description).toBe('');
  });

  it('calls onChange when removing item', () => {
    const onChange = vi.fn();
    render(React.createElement(InvoiceItemsTable, {
      items: baseItems, onChange, customerId: null,
    }));
    fireEvent.click(screen.getByTestId('DeleteIcon'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('does not show add/delete buttons in readOnly mode', () => {
    render(React.createElement(InvoiceItemsTable, {
      items: baseItems, onChange: vi.fn(), customerId: null, readOnly: true,
    }));
    expect(screen.queryByText('invoices.addItem')).not.toBeInTheDocument();
    expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
  });

  it('updates amount when hours change', () => {
    const onChange = vi.fn();
    render(React.createElement(InvoiceItemsTable, {
      items: baseItems, onChange, customerId: null,
    }));
    const hoursInput = screen.getByDisplayValue('2');
    fireEvent.change(hoursInput, { target: { value: '3' } });
    const updated = onChange.mock.calls[0][0] as InvoiceItemRow[];
    expect(updated[0].hours).toBe(3);
    expect(updated[0].amount).toBe(1500);
  });
});
