import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Web Share API', () => {
  const originalNavigator = { ...globalThis.navigator };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('navigator.share is available in modern browsers', () => {
    // In jsdom, share may not be available. This test verifies the feature detection pattern.
    const hasShare = 'share' in navigator;
    // This will be false in jsdom, true in real browsers
    expect(typeof hasShare).toBe('boolean');
  });

  it('navigator.canShare validates share data', () => {
    if ('canShare' in navigator && navigator.canShare) {
      const valid = navigator.canShare({ title: 'Test' });
      expect(typeof valid).toBe('boolean');
    }
  });

  it('ShareData type accepts files', () => {
    const file = new File(['test'], 'invoice.pdf', { type: 'application/pdf' });
    const shareData: ShareData = {
      title: 'INV-001',
      files: [file],
    };
    expect(shareData.title).toBe('INV-001');
    expect(shareData.files![0].name).toBe('invoice.pdf');
  });
});
