import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import Layout from '../../../src/components/Layout';

vi.mock('../../../src/contexts/AppContext', async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    useAppContext: () => ({
      state: { isDbOpen: true, dbPath: 'test', isDarkMode: false, isSettingsComplete: true, language: 'en' },
      setDbPath: vi.fn(), setDbOpen: vi.fn(), setSettingsComplete: vi.fn(),
      setLanguage: vi.fn(), toggleDarkMode: vi.fn(), resetState: vi.fn(),
    }),
  };
});

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

  it('should show save icon button when DB is open', () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));
    const saveIcon = screen.queryByTestId('SaveIcon');
    expect(saveIcon).toBeInTheDocument();
  });

  it('should show snackbar on backup event', async () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    act(() => {
      window.dispatchEvent(new CustomEvent('hkinv:backup', { detail: { success: true, manual: true } }));
    });

    expect(await screen.findByText(/layout\.saved/)).toBeInTheDocument();
  });

  it('should show snackbar with info message when backup not configured', async () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    act(() => {
      window.dispatchEvent(new CustomEvent('hkinv:backup', { detail: { success: false, manual: true } }));
    });

    expect(await screen.findByText(/layout\.backupNotConfigured/)).toBeInTheDocument();
  });

  it('should show snackbar on auto-backup event', async () => {
    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    act(() => {
      window.dispatchEvent(new CustomEvent('hkinv:backup', { detail: { success: true, manual: false } }));
    });

    expect(await screen.findByText(/layout\.autoBackupDone/)).toBeInTheDocument();
  });

  it('should call triggerBackup when save icon is clicked', async () => {
    const { triggerBackup } = await import('../../../src/database/backup');
    triggerBackup.mockClear();

    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    const saveIcon = screen.queryByTestId('SaveIcon');
    expect(saveIcon).toBeInTheDocument();

    fireEvent.click(saveIcon!);
    await vi.waitFor(() => {
      expect(triggerBackup).toHaveBeenCalledWith(true);
    });
  });

  it('should call configureBackupLocation when triggerBackup fails', async () => {
    const { triggerBackup } = await import('../../../src/database/backup');
    const { configureBackupLocation } = await import('../../../src/database/fsa');
    triggerBackup.mockClear();
    configureBackupLocation.mockClear();

    vi.mocked(triggerBackup).mockResolvedValue(false);
    vi.mocked(configureBackupLocation).mockResolvedValue(false);

    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    const saveIcon = screen.queryByTestId('SaveIcon');
    fireEvent.click(saveIcon!);

    await vi.waitFor(() => {
      expect(triggerBackup).toHaveBeenCalled();
      expect(configureBackupLocation).toHaveBeenCalled();
    });
  });

  it('should call triggerBackup again when configureBackupLocation succeeds', async () => {
    const { triggerBackup } = await import('../../../src/database/backup');
    const { configureBackupLocation } = await import('../../../src/database/fsa');
    triggerBackup.mockClear();
    configureBackupLocation.mockClear();

    let callCount = 0;
    vi.mocked(triggerBackup).mockImplementation(async () => {
      callCount++;
      return callCount > 1;
    });
    vi.mocked(configureBackupLocation).mockResolvedValue(true);

    renderWithProviders(React.createElement(Layout, { children: React.createElement('div', null, 'Content') }));

    const saveIcon = screen.queryByTestId('SaveIcon');
    fireEvent.click(saveIcon!);

    await vi.waitFor(() => {
      expect(triggerBackup).toHaveBeenCalledTimes(2);
      expect(configureBackupLocation).toHaveBeenCalledOnce();
    });
  });
});
