import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CustomerDialog from '../../../src/components/CustomerDialog';

describe('CustomerDialog', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const baseProps = { open: true, onSave, onClose };

  beforeEach(() => { vi.clearAllMocks(); });

  it('should render dialog when open', () => {
    render(React.createElement(CustomerDialog, baseProps));
    expect(screen.getByText('customers.new')).toBeInTheDocument(); // title uses i18n
  });

  it('should NOT render when open is false', () => {
    render(React.createElement(CustomerDialog, { ...baseProps, open: false }));
    expect(screen.queryByText('customers.new')).not.toBeInTheDocument();
  });

  it('should call onSave with name when save clicked', async () => {
    render(React.createElement(CustomerDialog, baseProps));
    const nameInput = await screen.findByRole('textbox', { name: /customers.name/i });
    fireEvent.change(nameInput, { target: { value: 'Test School' } });
    fireEvent.click(screen.getByText('common.save'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test School' }));
  });

  it('should show validation error when name is empty', async () => {
    render(React.createElement(CustomerDialog, baseProps));
    fireEvent.click(screen.getByText('common.save'));
    expect(await screen.findByText('validation.required')).toBeInTheDocument();
  });

  it('should call onClose on cancel', () => {
    render(React.createElement(CustomerDialog, baseProps));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display edit title when initial data provided', () => {
    render(React.createElement(CustomerDialog, { ...baseProps, initial: { id: 1, name: 'Old Name' } }));
    expect(screen.getByText('customers.edit')).toBeInTheDocument();
  });

  it('should pre-fill fields when editing', () => {
    render(React.createElement(CustomerDialog, { ...baseProps, initial: { id: 1, name: 'School', email: 's@t.com' } }));
    expect(screen.getByDisplayValue('School')).toBeInTheDocument();
    expect(screen.getByDisplayValue('s@t.com')).toBeInTheDocument();
  });
});
