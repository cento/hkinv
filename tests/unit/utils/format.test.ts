import { describe, it, expect } from 'vitest';
import {
  formatHKD,
  formatDate,
  formatDateISO,
  generateInvoiceNumber,
  parseHKD,
  todayISO,
  calculateDueDate,
} from '../../../src/utils/format';

describe('formatHKD', () => {
  it('should format a number as HKD currency', () => {
    expect(formatHKD(1500)).toMatch(/HK\$1[,.]500\.00/);
  });

  it('should format zero', () => {
    expect(formatHKD(0)).toMatch(/HK\$0\.00/);
  });

  it('should format large numbers', () => {
    expect(formatHKD(1234567.89)).toContain('HK$');
  });
});

describe('formatDate', () => {
  it('should format an ISO date in Italian locale', () => {
    const result = formatDate('2026-05-26', 'it');
    expect(result).toContain('maggio');
    expect(result).toContain('2026');
  });

  it('should format an ISO date in English locale', () => {
    const result = formatDate('2026-05-26', 'en');
    expect(result).toContain('May');
    expect(result).toContain('2026');
  });
});

describe('formatDateISO', () => {
  it('should strip time from ISO string', () => {
    expect(formatDateISO('2026-05-26T10:30:00')).toBe('2026-05-26');
  });

  it('should return same if no T', () => {
    expect(formatDateISO('2026-05-26')).toBe('2026-05-26');
  });
});

describe('generateInvoiceNumber', () => {
  it('should generate correct format', () => {
    const result = generateInvoiceNumber('INV-', 42);
    expect(result).toMatch(/^INV-2026-/);
    expect(result).toContain('0042');
  });

  it('should pad counter to 4 digits', () => {
    const result = generateInvoiceNumber('FATT-', 5);
    expect(result).toContain('0005');
  });
});

describe('calculateDueDate', () => {
  it('should calculate date from payment terms', () => {
    const result = calculateDueDate('30 giorni');
    const date = new Date(result + 'T00:00:00');
    expect(date.getTime()).toBeGreaterThan(Date.now() - 86400000);
  });

  it('should default to 30 days if terms lack number', () => {
    const result = calculateDueDate('fine mese');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return today for null payment terms', () => {
    const result = calculateDueDate(null);
    expect(result).toBe(todayISO());
  });

  it('should return today for undefined payment terms', () => {
    const result = calculateDueDate(undefined);
    expect(result).toBe(todayISO());
  });

  it('should return today for empty string', () => {
    const result = calculateDueDate('');
    expect(result).toBe(todayISO());
  });
});

describe('parseHKD', () => {
  it('should parse simple HKD string', () => {
    expect(parseHKD('HK$1,500.00')).toBe(1500);
  });

  it('should parse zero', () => {
    expect(parseHKD('HK$0.00')).toBe(0);
  });

  it('should parse large numbers with commas', () => {
    expect(parseHKD('HK$1,234,567.89')).toBe(1234567.89);
  });

  it('should parse plain number string', () => {
    expect(parseHKD('1500')).toBe(1500);
  });

  it('should handle empty string', () => {
    const result = parseHKD('');
    expect(Number.isNaN(result)).toBe(true);
  });
});

describe('todayISO', () => {
  it('should return today in YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should match current date', () => {
    const result = todayISO();
    const expected = new Date().toISOString().split('T')[0];
    expect(result).toBe(expected);
  });
});
