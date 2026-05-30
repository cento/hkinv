import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import CustomersPage from '../../../src/pages/CustomersPage';

vi.mock('../../../src/services/dbService', () => ({
  default: {
    customersGetAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Scuola HK', address: 'Central', email: 'info@scuola.hk' },
      { id: 2, name: 'Private Student', address: 'Kowloon', email: 'student@test.hk' },
    ]),
    customersCreate: vi.fn().mockResolvedValue(1),
    customersUpdate: vi.fn().mockResolvedValue({ success: true }),
    customersDelete: vi.fn().mockResolvedValue({ success: true }),
    customersSearch: vi.fn().mockResolvedValue([]),
  },
}));

function renderPage() {
  return render(React.createElement(MemoryRouter, null, React.createElement(CustomersPage)));
}

describe('CustomersPage CRUD', () => {
  it('renders customer list after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Scuola HK')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('Private Student')).toBeInTheDocument();
  });

  it('shows new customer button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('customers.title')).toBeInTheDocument());
    expect(screen.getByText('customers.new')).toBeInTheDocument();
  });
});
