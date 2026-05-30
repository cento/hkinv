import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../../src/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(React.createElement(ErrorBoundary, null,
      React.createElement('div', null, 'Child content')
    ));
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches rendering errors and shows fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(React.createElement(ErrorBoundary, null,
      React.createElement(ThrowError)
    ));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('uses custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(React.createElement(ErrorBoundary, { fallback: React.createElement('div', null, 'Custom error') },
      React.createElement(ThrowError)
    ));
    expect(screen.getByText('Custom error')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
