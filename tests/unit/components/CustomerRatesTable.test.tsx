import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CustomerRatesTable from '../../../src/components/CustomerRatesTable';

vi.mock('../../../src/services/dbService', () => ({
  default: {
    customerRatesGetAllForCustomer: vi.fn().mockResolvedValue([
      { id: 1, service_type_id: 1, custom_rate: 450, custom_description: 'Special', service_name: 'Lesson' },
    ]),
    serviceTypesGetAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Lesson', default_rate: 500, default_hours: 1 },
      { id: 2, name: 'Workshop', default_rate: 1000, default_hours: 3 },
    ]),
    customerRatesDelete: vi.fn().mockResolvedValue({ success: true }),
    customerRatesSet: vi.fn().mockResolvedValue(1),
  },
}));

describe('CustomerRatesTable', () => {
  it('renders rates list', async () => {
    render(React.createElement(CustomerRatesTable, { customerId: 1 }));
    await waitFor(() => expect(screen.getByText('Lesson')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('HK$450.00')).toBeInTheDocument();
  });

  it('shows add rate dialog', async () => {
    render(React.createElement(CustomerRatesTable, { customerId: 1 }));
    await waitFor(() => expect(screen.getByText(/customerRates\.new/)).toBeInTheDocument(), { timeout: 5000 });
    fireEvent.click(screen.getAllByText(/customerRates\.new/)[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('shows delete confirmation dialog', async () => {
    render(React.createElement(CustomerRatesTable, { customerId: 1 }));
    await waitFor(() => expect(screen.getByText('Lesson')).toBeInTheDocument(), { timeout: 5000 });
    fireEvent.click(screen.getByTestId('DeleteIcon'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument(), { timeout: 3000 });
  });
});
