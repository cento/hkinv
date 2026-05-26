import { describe, it, expect } from 'vitest';
import { exportToCsv, formatDateForCsv } from '../../../src/utils/csv';

describe('exportToCsv', () => {
  it('should generate CSV with BOM and headers', () => {
    const result = exportToCsv('test.csv', ['Name', 'Age'], [['Alice', '30'], ['Bob', '25']]);
    expect(result.startsWith('\uFEFF')).toBe(true);
    expect(result).toContain('Name,Age');
    expect(result).toContain('Alice,30');
    expect(result).toContain('Bob,25');
  });

  it('should escape commas in values', () => {
    const result = exportToCsv('test.csv', ['Name'], [['Doe, John']]);
    expect(result).toContain('"Doe, John"');
  });

  it('should escape double quotes', () => {
    const result = exportToCsv('test.csv', ['Note'], [['He said "hello"']]);
    expect(result).toContain('"He said ""hello"""');
  });

  it('should handle empty rows', () => {
    const result = exportToCsv('test.csv', ['A', 'B'], []);
    expect(result).toBe('\uFEFFA,B');
  });
});

describe('formatDateForCsv', () => {
  it('should return the date string as-is', () => {
    expect(formatDateForCsv('2026-05-27')).toBe('2026-05-27');
  });
  it('should return empty string for null/undefined', () => {
    expect(formatDateForCsv('')).toBe('');
  });
});


