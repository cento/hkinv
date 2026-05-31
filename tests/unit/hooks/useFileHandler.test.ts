import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFileHandler } from '../../../src/hooks/useFileHandler';

describe('useFileHandler', () => {
  it('registers launch consumer when launchQueue is available', () => {
    const mockSetConsumer = vi.fn();
    const originalLaunchQueue = (window as any).launchQueue;
    (window as any).launchQueue = { setConsumer: mockSetConsumer };

    const onFile = vi.fn();
    renderHook(() => useFileHandler(onFile));

    expect(mockSetConsumer).toHaveBeenCalledOnce();
    (window as any).launchQueue = originalLaunchQueue;
  });

  it('does not throw when launchQueue is unavailable', () => {
    const originalLaunchQueue = (window as any).launchQueue;
    delete (window as any).launchQueue;

    const onFile = vi.fn();
    expect(() => renderHook(() => useFileHandler(onFile))).not.toThrow();

    (window as any).launchQueue = originalLaunchQueue;
  });

  it('calls onFile when launchParams contains files', async () => {
    let consumer: any = null;
    const mockSetConsumer = vi.fn((c: any) => { consumer = c; });
    const originalLaunchQueue = (window as any).launchQueue;
    (window as any).launchQueue = { setConsumer: mockSetConsumer };

    const onFile = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useFileHandler(onFile));

    expect(consumer).not.toBeNull();
    await consumer({ files: [{ kind: 'file', name: 'test.hkinv' }] });
    expect(onFile).toHaveBeenCalledOnce();

    (window as any).launchQueue = originalLaunchQueue;
  });

  it('does not call onFile when launchParams has no files', async () => {
    let consumer: any = null;
    const mockSetConsumer = vi.fn((c: any) => { consumer = c; });
    const originalLaunchQueue = (window as any).launchQueue;
    (window as any).launchQueue = { setConsumer: mockSetConsumer };

    const onFile = vi.fn();
    renderHook(() => useFileHandler(onFile));

    await consumer({ files: [] });
    expect(onFile).not.toHaveBeenCalled();

    (window as any).launchQueue = originalLaunchQueue;
  });
});
