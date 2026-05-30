import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../src/contexts/AppContext';
import CloudBackupPage from '../../../src/pages/CloudBackupPage';

const mockConfigureBackupLocation = vi.fn().mockResolvedValue(true);
const mockClearStoredBackupHandle = vi.fn();
const mockDownloadBlob = vi.fn();

vi.mock('../../../src/database/fsa', () => ({
  configureBackupLocation: (...args: any[]) => mockConfigureBackupLocation(...args),
  getStoredBackupFileName: vi.fn(() => 'my-backup.hkinv'),
  clearStoredBackupHandle: (...args: any[]) => mockClearStoredBackupHandle(...args),
  downloadBlob: (...args: any[]) => mockDownloadBlob(...args),
  supportsFSA: () => true,
  saveHKINVFile: vi.fn().mockResolvedValue(null),
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

  it('clicking change location calls configureBackupLocation', async () => {
    mockConfigureBackupLocation.mockClear();
    renderPage();
    const changeBtn = await screen.findByText('cloudBackup.changeLocation');
    fireEvent.click(changeBtn);
    await waitFor(() => {
      expect(mockConfigureBackupLocation).toHaveBeenCalled();
    });
  });

  it('clicking save to drive exports database', async () => {
    mockDownloadBlob.mockClear();
    renderPage();
    const saveBtn = await screen.findByText('cloudBackup.saveToDrive');
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(mockDownloadBlob).toHaveBeenCalled();
    });
  });

  it('clicking remove backup clears handle and updates UI', async () => {
    mockClearStoredBackupHandle.mockClear();
    renderPage();
    const removeBtn = await screen.findByText('cloudBackup.remove');
    fireEvent.click(removeBtn);
    await waitFor(() => {
      expect(mockClearStoredBackupHandle).toHaveBeenCalled();
    });
  });
});
