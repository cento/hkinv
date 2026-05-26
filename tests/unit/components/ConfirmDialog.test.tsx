import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../../../src/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const baseProps = { open: true, message: 'Are you sure?', onConfirm, onCancel };

  beforeEach(() => { vi.clearAllMocks(); });

  it('should render when open is true', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should NOT render when open is false', () => {
    render(<ConfirmDialog {...baseProps} open={false} />);
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...baseProps} />);
    const btns = screen.getAllByText('common.delete');
    fireEvent.click(btns[1]);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...baseProps} />);
    const btns = screen.getAllByText('common.cancel');
    fireEvent.click(btns[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should display custom title', () => {
    render(<ConfirmDialog {...baseProps} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should display custom confirm label', () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Yes, delete" />);
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
  });

  it('should display custom cancel label', () => {
    render(<ConfirmDialog {...baseProps} cancelLabel="No, keep" />);
    expect(screen.getByText('No, keep')).toBeInTheDocument();
  });

  it('should use custom confirm color', () => {
    render(<ConfirmDialog {...baseProps} confirmColor="primary" />);
    const btns = screen.getAllByText('common.delete');
    expect(btns[1].getAttribute('class')).toContain('MuiButton-contained');
  });
});
