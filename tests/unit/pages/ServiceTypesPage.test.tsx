import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ServiceTypesPage from '../../../src/pages/ServiceTypesPage';

const mockIsInUse = vi.fn().mockResolvedValue(false);
const mockDelete = vi.fn().mockResolvedValue(true);
const mockGetAll = vi.fn().mockResolvedValue([
  { id: 1, name: 'Lesson', description_template: 'Italian lesson', default_rate: 500, default_hours: 1 },
  { id: 2, name: 'Workshop', description_template: 'Group workshop', default_rate: 1000, default_hours: 3 },
]);

vi.mock('../../../src/services/dbService', () => ({
  default: {
    serviceTypesGetAll: () => mockGetAll(),
    serviceTypesIsInUse: (id: number) => mockIsInUse(id),
    serviceTypesDelete: (id: number) => mockDelete(id),
    serviceTypesCreate: () => Promise.resolve(1),
    serviceTypesUpdate: () => Promise.resolve({ success: true }),
  },
}));

function renderPage() {
  return render(React.createElement(ServiceTypesPage));
}

describe('ServiceTypesPage', () => {
  it('renders service types in grid', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Lesson')).toBeInTheDocument());
    expect(screen.getByText('Workshop')).toBeInTheDocument();
  });

  it('blocks delete when service is in use', async () => {
    mockIsInUse.mockResolvedValueOnce(true);
    renderPage();
    await waitFor(() => expect(screen.getByText('Lesson')).toBeInTheDocument());

    // Find delete buttons in action column (not toolbar)
    const deleteBtns = screen.getAllByRole('button', { name: /common\.delete/ });
    fireEvent.click(deleteBtns[0]);

    // Confirm dialog appears
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // Click the confirm delete button in dialog
    const confirmBtns = screen.getAllByRole('button', { name: /common\.delete/ });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('serviceTypes.inUse')).toBeInTheDocument();
    });
    expect(mockDelete).not.toHaveBeenCalled();
  }, 10000);

  it('allows delete when service is not in use', async () => {
    mockIsInUse.mockResolvedValueOnce(false);
    mockDelete.mockClear();
    renderPage();
    await waitFor(() => expect(screen.getByText('Lesson')).toBeInTheDocument());

    const deleteBtns = screen.getAllByRole('button', { name: /common\.delete/ });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const confirmBtns = screen.getAllByRole('button', { name: /common\.delete/ });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
  }, 10000);
});
