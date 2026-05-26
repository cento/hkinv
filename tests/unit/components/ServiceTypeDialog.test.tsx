import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ServiceTypeDialog from '../../../src/components/ServiceTypeDialog';

describe('ServiceTypeDialog', () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const baseProps = { open: true, onSave, onClose };

  beforeEach(() => { vi.clearAllMocks(); });

  it('should render dialog when open', () => {
    render(React.createElement(ServiceTypeDialog, baseProps));
    expect(screen.getByText('serviceTypes.new')).toBeInTheDocument();
  });

  it('should NOT render when open is false', () => {
    render(React.createElement(ServiceTypeDialog, { ...baseProps, open: false }));
    expect(screen.queryByText('serviceTypes.new')).not.toBeInTheDocument();
  });

  it('should call onSave with valid data', async () => {
    render(React.createElement(ServiceTypeDialog, baseProps));
    const nameInput = await screen.findByLabelText(/serviceTypes.name/i);
    fireEvent.change(nameInput, { target: { value: 'Lesson' } });
    const rateInput = screen.getByLabelText(/serviceTypes.rate/i);
    fireEvent.change(rateInput, { target: { value: '500' } });
    const hoursInput = screen.getByLabelText(/serviceTypes.hours/i);
    fireEvent.change(hoursInput, { target: { value: '2' } });
    fireEvent.click(screen.getByText('common.save'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Lesson', default_rate: 500, default_hours: 2,
    }));
  });

  it('should show validation error when name is empty', async () => {
    render(React.createElement(ServiceTypeDialog, baseProps));
    fireEvent.click(screen.getByText('common.save'));
    expect(await screen.findByText('validation.required')).toBeInTheDocument();
  });

  it('should show validation error when rate is zero', async () => {
    render(React.createElement(ServiceTypeDialog, baseProps));
    const nameInput = await screen.findByLabelText(/serviceTypes.name/i);
    fireEvent.change(nameInput, { target: { value: 'Lesson' } });
    const rateInput = screen.getByLabelText(/serviceTypes.rate/i);
    fireEvent.change(rateInput, { target: { value: '0' } });
    fireEvent.click(screen.getByText('common.save'));
    expect(await screen.findByText('validation.positive')).toBeInTheDocument();
  });

  it('should call onClose on cancel', () => {
    render(React.createElement(ServiceTypeDialog, baseProps));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display edit title with initial data', () => {
    render(React.createElement(ServiceTypeDialog, { ...baseProps, initial: { name: 'Old' } }));
    expect(screen.getByText('serviceTypes.edit')).toBeInTheDocument();
  });
});
