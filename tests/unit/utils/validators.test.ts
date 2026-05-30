import { describe, it, expect } from 'vitest';
import {
  validateSettings,
  validateCustomer,
  validateInvoice,
  validateInvoiceItem,
  validateServiceType,
} from '../../../src/utils/validators';

describe('validateSettings', () => {
  it('should require teacher_name and teacher_address', () => {
    const result = validateSettings({});
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'teacher_name')).toBe(true);
    expect(result.errors.some(e => e.field === 'teacher_address')).toBe(true);
  });

  it('should pass with valid data', () => {
    const result = validateSettings({
      teacher_name: 'Mario',
      teacher_address: 'Via Roma 1',
    });
    expect(result.valid).toBe(true);
  });

  it('should validate optional email', () => {
    const result = validateSettings({
      teacher_name: 'Mario',
      teacher_address: 'Via Roma 1',
      teacher_email: 'not-an-email',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'teacher_email')).toBe(true);
  });

  it('should accept valid email', () => {
    const result = validateSettings({
      teacher_name: 'Mario',
      teacher_address: 'Via Roma 1',
      teacher_email: 'mario@test.com',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateCustomer', () => {
  it('should require name', () => {
    expect(validateCustomer({}).valid).toBe(false);
  });

  it('should pass with valid name', () => {
    expect(validateCustomer({ name: 'Scuola Roma' }).valid).toBe(true);
  });
});

describe('validateInvoice', () => {
  it('should require customer_id and issue_date', () => {
    const result = validateInvoice({});
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'customer_id')).toBe(true);
    expect(result.errors.some(e => e.field === 'issue_date')).toBe(true);
  });

  it('should pass with valid data', () => {
    const result = validateInvoice({ customer_id: 1, issue_date: '2026-05-26' });
    expect(result.valid).toBe(true);
  });

  it('should not require invoice_number (auto-generated)', () => {
    const result = validateInvoice({ customer_id: 1, issue_date: '2026-05-26' });
    expect(result.valid).toBe(true);
  });
});

describe('validateInvoiceItem', () => {
  it('should require description, positive hours and non-negative rate', () => {
    const result = validateInvoiceItem({});
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'description')).toBe(true);
    expect(result.errors.some(e => e.field === 'hours')).toBe(true);
    expect(result.errors.some(e => e.field === 'rate')).toBe(true);
  });

  it('should pass with valid data', () => {
    const result = validateInvoiceItem({ description: 'Lezione', hours: 1, rate: 500 });
    expect(result.valid).toBe(true);
  });

  it('should reject zero or negative hours', () => {
    const result = validateInvoiceItem({ description: 'Test', hours: 0, rate: 100 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'hours')).toBe(true);
  });
});
