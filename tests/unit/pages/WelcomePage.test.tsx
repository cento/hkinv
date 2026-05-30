import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AppProvider } from '../../../src/contexts/AppContext';
import WelcomePage from '../../../src/pages/WelcomePage';
import { hasExistingDB } from '../../../src/database/opfs';

vi.mock('../../../src/database/connection', () => ({
  createDatabase: () => Promise.resolve({ run: () => {}, close: () => {} } as any),
  importDatabase: () => Promise.resolve({ run: () => {}, close: () => {} } as any),
  openDatabase: () => Promise.resolve({ run: () => {}, close: () => {} } as any),
  getDatabase: () => ({ name: 'test' } as any),
  saveDatabase: () => {},
  closeDatabase: () => {},
  isDatabaseOpen: () => false,
  getDbPath: () => null,
}));

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(WelcomePage)));
}

describe('WelcomePage', () => {
  it('should render the app title', () => {
    renderPage();
    expect(screen.getByText('app.title')).toBeInTheDocument();
  });

  it('should show Create and Open buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('welcome.newDb')).toBeInTheDocument();
      expect(screen.getByText('welcome.openDb')).toBeInTheDocument();
    });
  });

  it('should render the subtitle', () => {
    renderPage();
    expect(screen.getByText('app.subtitle')).toBeInTheDocument();
  });

  it('should render the create new hint text', () => {
    renderPage();
    expect(screen.getByText('welcome.createNew')).toBeInTheDocument();
  });

  it('should show recent archives list when items exist', async () => {
    localStorage.setItem('recent-archives', JSON.stringify([
      { name: 'school.hkinv', lastOpened: new Date().toISOString() },
      { name: 'private.hkinv', lastOpened: new Date().toISOString() },
    ]));

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('welcome.lastOpened')).toBeInTheDocument();
    });

    localStorage.removeItem('recent-archives');
  });

  it('should show Continue button when DB exists in OPFS', async () => {
    vi.mocked(hasExistingDB).mockResolvedValue(true);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/welcome\.continueExisting/)).toBeInTheDocument();
      expect(screen.getByText(/welcome\.setBackup/)).toBeInTheDocument();
    });

    vi.mocked(hasExistingDB).mockResolvedValue(false);
  });

  it('should hide Continue button when no DB in OPFS', async () => {
    vi.mocked(hasExistingDB).mockResolvedValue(false);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('app.title')).toBeInTheDocument();
    });

    expect(screen.queryByText(/welcome\.continueExisting/)).not.toBeInTheDocument();
    expect(screen.queryByText(/welcome\.setBackup/)).not.toBeInTheDocument();
  });
});
