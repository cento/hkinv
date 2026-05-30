import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PDFPreviewDialog from '../../../src/components/PDFPreviewDialog';

describe('PDFPreviewDialog', () => {
  it('renders when open with pdf data', () => {
    render(React.createElement(PDFPreviewDialog, {
      open: true,
      onClose: vi.fn(),
      pdfData: 'data:application/pdf;base64,JVBERi0x',
      fileName: 'test.pdf',
    }));
    expect(screen.getByText('invoices.exportPdf')).toBeInTheDocument();
    expect(screen.getByText('common.close')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(React.createElement(PDFPreviewDialog, {
      open: false,
      onClose: vi.fn(),
      pdfData: null,
    }));
    expect(screen.queryByText('invoices.exportPdf')).not.toBeInTheDocument();
  });

  it('shows loading text when pdfData is null', () => {
    render(React.createElement(PDFPreviewDialog, {
      open: true,
      onClose: vi.fn(),
      pdfData: null,
      fileName: 'test.pdf',
    }));
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });
});
