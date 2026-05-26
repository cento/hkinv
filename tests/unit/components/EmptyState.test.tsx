import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// EmptyState is exported from ConfirmDialog component
import { EmptyState } from '../../../src/components/ConfirmDialog';

describe('EmptyState', () => {
  it('should render message text', () => {
    render(React.createElement(EmptyState, { message: 'No data found' }));
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('should render action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(React.createElement(EmptyState, { message: 'Empty', actionLabel: 'Add new', onAction }));
    const btn = screen.getByText('Add new');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should NOT render action button when onAction is missing', () => {
    render(React.createElement(EmptyState, { message: 'Empty', actionLabel: 'Add' }));
    expect(screen.queryByText('Add')).not.toBeInTheDocument();
  });

  it('should render inbox icon', () => {
    const { container } = render(React.createElement(EmptyState, { message: 'Empty' }));
    expect(container.querySelector('[data-testid="InboxIcon"]')).toBeInTheDocument();
  });
});
