import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../../src/components/Layout';

// Mock useAppContext to return isDbOpen: true so BackupIndicator renders
vi.mock('../../../src/contexts/AppContext', async () => {
  const actual = await vi.importActual('../../../src/contexts/AppContext');
  return {
    ...actual,
    useAppContext: () => ({
      state: {
        dbPath: 'test.hkinv',
        isDbOpen: true,
        isSettingsComplete: true,
        language: 'en',
        isDarkMode: false,
      },
      setDbPath: vi.fn(),
      setDbOpen: vi.fn(),
      setSettingsComplete: vi.fn(),
      setLanguage: vi.fn(),
      toggleDarkMode: vi.fn(),
      resetState: vi.fn(),
    }),
  };
});

vi.mock('../../../src/database/backup', () => ({
  isBackupConfigured: () => false,
  getBackupFileName: () => null,
  getLastBackupTime: () => null,
  stopBackupTimer: vi.fn(),
  startBackupTimer: vi.fn(),
  triggerBackup: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../../src/database/fsa', () => ({
  configureBackupLocation: vi.fn(),
  getStoredBackupFileName: () => null,
  clearStoredBackupHandle: vi.fn(),
  downloadBlob: vi.fn(),
  supportsFSA: () => false,
  saveHKINVFile: vi.fn(),
}));

function renderLayout() {
  return render(
    React.createElement(MemoryRouter, null,
      React.createElement(Layout, null,
        React.createElement('div', null, 'Content')
      )
    )
  );
}

describe('Layout BackupIndicator', () => {
  it('renders save to file button when db is open', async () => {
    renderLayout();
    await waitFor(() => expect(screen.getByText('Content')).toBeInTheDocument());
    expect(screen.getByLabelText('layout.saveToFile')).toBeInTheDocument();
  });
});
