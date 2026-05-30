import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AppProvider } from '../../../src/contexts/AppContext';

const mockSettingsSave = vi.fn().mockResolvedValue({ success: true });
const mockSettingsGet = vi.fn().mockResolvedValue({
  teacher_name: 'Mario Rossi',
  teacher_address: 'Via Roma 1',
  teacher_email: 'mario@example.com',
  teacher_phone: '+852 12345678',
  br_number: 'BR12345',
  invoice_prefix: 'INV-',
  default_payment_terms: '30 giorni',
  invoice_counter: 1,
  default_currency: 'HKD',
  bank_details: 'HSBC 123-456',
});

vi.mock('../../../src/services/dbService', () => ({
  default: {
    settingsGet: () => mockSettingsGet(),
    settingsSave: (data: any) => mockSettingsSave(data),
  },
}));

import SettingsPage from '../../../src/pages/SettingsPage';

function renderPage() {
  return render(React.createElement(AppProvider, null, React.createElement(SettingsPage)));
}

describe('SettingsPage', () => {
  it('renders title and teacher info section', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('settings.title')).toBeInTheDocument());
    expect(screen.getByText('settings.teacherInfo')).toBeInTheDocument();
  });

  it('renders invoice defaults section', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('settings.invoiceDefaults')).toBeInTheDocument());
  });

  it('renders save button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('common.save')).toBeInTheDocument());
  });

  it('save button is disabled when required fields are empty', async () => {
    mockSettingsGet.mockResolvedValueOnce({
      teacher_name: '',
      teacher_address: '',
      teacher_email: '',
      teacher_phone: '',
      br_number: '',
      invoice_prefix: 'INV-',
      default_payment_terms: '30 giorni',
      invoice_counter: 1,
      default_currency: 'HKD',
      bank_details: '',
    });
    renderPage();
    const saveBtn = await screen.findByRole('button', { name: 'common.save' });
    expect(saveBtn).toBeDisabled();
    fireEvent.click(saveBtn);
    expect(mockSettingsSave).not.toHaveBeenCalled();
  });

  it('calls settingsSave on valid form', async () => {
    mockSettingsSave.mockClear();
    mockSettingsGet.mockResolvedValueOnce({
      teacher_name: 'Mario Rossi',
      teacher_address: 'Via Roma 1',
      teacher_email: 'mario@example.com',
      teacher_phone: '+852 12345678',
      br_number: 'BR12345',
      invoice_prefix: 'INV-',
      default_payment_terms: '30 giorni',
      invoice_counter: 1,
      default_currency: 'HKD',
      bank_details: 'HSBC 123-456',
    });
    renderPage();
    const saveBtn = await screen.findByText('common.save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSettingsSave).toHaveBeenCalled();
    });
  });
});
