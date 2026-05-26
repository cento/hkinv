import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Translations', () => {
  const itPath = path.resolve(__dirname, '../../../src/i18n/it.json');
  const enPath = path.resolve(__dirname, '../../../src/i18n/en.json');

  const itTranslations = JSON.parse(fs.readFileSync(itPath, 'utf-8'));
  const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  it('should have the same keys in IT and EN', () => {
    const itKeys = Object.keys(itTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();

    const missingInEn = itKeys.filter(k => !(k in enTranslations));
    const missingInIt = enKeys.filter(k => !(k in itTranslations));

    if (missingInEn.length > 0) {
      console.log('Keys missing in EN:', missingInEn);
    }
    if (missingInIt.length > 0) {
      console.log('Keys missing in IT:', missingInIt);
    }

    expect(missingInEn).toHaveLength(0);
    expect(missingInIt).toHaveLength(0);
  });

  it('should not have empty translations', () => {
    const emptyKeys: string[] = [];
    for (const [key, value] of Object.entries(itTranslations)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        emptyKeys.push(`it:${key}`);
      }
    }
    for (const [key, value] of Object.entries(enTranslations)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        emptyKeys.push(`en:${key}`);
      }
    }
    expect(emptyKeys).toHaveLength(0);
  });

  it('should have key count reasonable (at least 100 keys each)', () => {
    expect(Object.keys(itTranslations).length).toBeGreaterThanOrEqual(100);
    expect(Object.keys(enTranslations).length).toBeGreaterThanOrEqual(100);
  });
});
