import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import CloudBackupPage from '../../../src/pages/CloudBackupPage';

vi.mock('../../../src/database/fsa', () => ({
  configureBackupLocation: vi.fn().mockResolvedValue(true),
  getStoredBackupFileName: vi.fn(() => 'my-backup.hkinv'),
  clearStoredBackupHandle: vi.fn(),
  downloadBlob: vi.fn(),
}));

vi.mock('../../../src/database/connection', () => ({
  getDatabase: () => ({ export: () => new Uint8Array([1, 2, 3]) }),
}));

vi.mock('../../../src/database/backup', () => ({
  isBackupConfigured: vi.fn(() => true),
  getLastBackupTime: vi.fn(() => new Date('2026-05-30T12:00:00')),
  stopBackupTimer: vi.fn(),
  startBackupTimer: vi.fn(),
}));

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(MemoryRouter, null, React.createElement(CloudBackupPage))));
}

describe('CloudBackupPage', () => {
  it('renders title and cloud backup section', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('cloudBackup.title')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('cloudBackup.googleDrive')).toBeInTheDocument();
  });

  it('shows backup status', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('cloudBackup.saveToDrive')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText('cloudBackup.changeLocation')).toBeInTheDocument();
  });
});
