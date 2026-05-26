import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';

// Import all pages
import DashboardPage from '../../../src/pages/DashboardPage';
import InvoicesPage from '../../../src/pages/InvoicesPage';
import CustomersPage from '../../../src/pages/CustomersPage';
import ServiceTypesPage from '../../../src/pages/ServiceTypesPage';
import SettingsPage from '../../../src/pages/SettingsPage';
import InvoiceEditPage from '../../../src/pages/InvoiceEditPage';

// Helper to render a page with all needed providers
function renderPage(Component: React.ElementType, initialRoute = '/'): void {
  render(
    React.createElement(AppProvider, null,
      React.createElement(MemoryRouter, { initialEntries: [initialRoute] },
        React.createElement(Component)
      )
    )
  );
}

describe('Page smoke tests - render without crashing', () => {
  it('DashboardPage renders', async () => {
    renderPage(DashboardPage);
    expect(screen.getByText('dashboard.title')).toBeInTheDocument();
  });

  it('InvoicesPage renders', async () => {
    renderPage(InvoicesPage, '/invoices');
    expect(screen.getByText('invoices.title')).toBeInTheDocument();
  });

  it('CustomersPage renders', async () => {
    renderPage(CustomersPage, '/customers');
    expect(screen.getByText('customers.title')).toBeInTheDocument();
  });

  it('ServiceTypesPage renders', async () => {
    renderPage(ServiceTypesPage, '/service-types');
    expect(screen.getByText('serviceTypes.title')).toBeInTheDocument();
  });

  it('SettingsPage renders', async () => {
    renderPage(SettingsPage, '/settings');
    expect(screen.getByText('settings.title')).toBeInTheDocument();
  });

  it('InvoiceEditPage (new) renders without crashing - REGRESSION: useBlocker crash', async () => {
    renderPage(InvoiceEditPage, '/invoices/new');
    expect(screen.getByText('invoices.new')).toBeInTheDocument();
  });

  it('InvoiceEditPage (edit) renders without crashing', async () => {
    renderPage(InvoiceEditPage, '/invoices/1');
    expect(screen.getByText('common.back')).toBeInTheDocument();
  });
});
