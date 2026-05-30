import { describe, it, expect } from 'vitest';
import { formatHKD, formatDate, generateInvoiceNumber, calculateDueDate, parseHKD, todayISO } from '../../../src/utils/format';

describe('formatHKD', () => {
  it('formats zero correctly', () => {
    expect(formatHKD(0)).toContain('0.00');
  });

  it('formats integer with HK$ prefix', () => {
    const result = formatHKD(1500);
    expect(result).toContain('HK$');
    expect(result).toContain('1,500.00');
  });

  it('formats decimal amounts', () => {
    const result = formatHKD(1234.5);
    expect(result).toContain('1,234.50');
  });

  it('formats large numbers', () => {
    const result = formatHKD(1000000);
    expect(result).toContain('1,000,000.00');
  });

  it('handles negative amounts', () => {
    const result = formatHKD(-500);
    expect(result).toContain('-500.00');
  });
});

describe('generateInvoiceNumber', () => {
  it('generates correct format', () => {
    const num = generateInvoiceNumber('INV-', 42);
    const year = new Date().getFullYear().toString();
    expect(num).toBe(`INV-${year}-0042`);
  });

  it('pads counter to 4 digits', () => {
    const num = generateInvoiceNumber('F-', 7);
    expect(num).toMatch(/F-\d{4}-0007$/);
  });
});

describe('calculateDueDate', () => {
  it('returns future date for "30 giorni"', () => {
    const result = calculateDueDate('30 giorni');
    const today = new Date();
    const expected = new Date(today);
    expected.setDate(expected.getDate() + 30);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });

  it('returns today for null input', () => {
    expect(calculateDueDate(null)).toBe(todayISO());
  });

  it('extracts first number from arbitrary text', () => {
    const result = calculateDueDate('pagamento entro 15 giorni');
    const today = new Date();
    today.setDate(today.getDate() + 15);
    expect(result).toBe(today.toISOString().split('T')[0]);
  });
});

describe('parseHKD', () => {
  it('parses HK$ formatted string', () => {
    expect(parseHKD('HK$1,500.00')).toBe(1500);
  });

  it('parses plain number string', () => {
    expect(parseHKD('1234.56')).toBe(1234.56);
  });
});

describe('formatDate', () => {
  it('formats Italian locale', () => {
    const result = formatDate('2026-05-30', 'it');
    expect(result).toContain('2026');
    expect(result).toContain('maggio');
  });

  it('formats English locale', () => {
    const result = formatDate('2026-05-30', 'en');
    expect(result).toContain('2026');
    expect(result).toContain('May');
  });
});
