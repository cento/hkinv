import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import Layout from '../../../src/components/Layout';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    React.createElement(AppProvider, null,
      React.createElement(MemoryRouter, { initialEntries: ['/invoices'] }, ui)
    )
  );
}

describe('Layout', () => {
  it('should render sidebar with navigation items', () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('nav.invoices')).toBeInTheDocument();
    expect(screen.getByText('nav.customers')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show language toggle buttons', () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should show dark mode toggle icon button', () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));
    const darkBtn = screen.getByTestId('DarkModeIcon');
    expect(darkBtn).toBeInTheDocument();
  });
});
