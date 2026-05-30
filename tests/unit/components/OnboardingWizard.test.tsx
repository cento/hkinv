import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import OnboardingWizard from '../../../src/components/OnboardingWizard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWizard(open = true, onFinish?: () => void) {
  return render(
    React.createElement(MemoryRouter, null,
      React.createElement(OnboardingWizard, { open, onFinish: onFinish || vi.fn() })
    )
  );
}

describe('OnboardingWizard', () => {
  it('renders wizard title when open', () => {
    renderWizard(true);
    expect(screen.getByText('wizard.title')).toBeInTheDocument();
    expect(screen.getByText('wizard.subtitle')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWizard(false);
    expect(screen.queryByText('wizard.title')).not.toBeInTheDocument();
  });

  it('shows all three steps', () => {
    renderWizard(true);
    expect(screen.getByText('wizard.stepSettings')).toBeInTheDocument();
    expect(screen.getByText('wizard.stepCustomer')).toBeInTheDocument();
    expect(screen.getByText('wizard.stepInvoice')).toBeInTheDocument();
  });

  it('first step shows settings action button', () => {
    renderWizard(true);
    expect(screen.getByText('settings.title')).toBeInTheDocument();
  });

  it('skip button advances to next step', () => {
    renderWizard(true);
    const skipBtns = screen.getAllByText(/common\.skip/);
    fireEvent.click(skipBtns[0]);
    // After clicking skip on step 1, step 2 content should be visible
    expect(screen.getByText('customers.title')).toBeInTheDocument();
  });

  it('navigating to last step shows finish button', () => {
    renderWizard(true);
    // Click skip on step 1 → step 2
    fireEvent.click(screen.getAllByText(/common\.skip/)[0]);
    // Click skip on step 2 → step 3
    fireEvent.click(screen.getAllByText(/common\.skip/)[0]);
    // Now on step 3, finish button should be visible
    expect(screen.getByText('wizard.finish')).toBeInTheDocument();
  });

  it('finish button calls onFinish', () => {
    const onFinish = vi.fn();
    renderWizard(true, onFinish);
    // Navigate to last step
    fireEvent.click(screen.getAllByText(/common\.skip/)[0]);
    fireEvent.click(screen.getAllByText(/common\.skip/)[0]);
    // Click finish
    fireEvent.click(screen.getByText('wizard.finish'));
    expect(onFinish).toHaveBeenCalled();
  });

  it('settings button navigates to settings page', () => {
    mockNavigate.mockClear();
    renderWizard(true);
    fireEvent.click(screen.getByText('settings.title'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
