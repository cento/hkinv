import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call handler on Ctrl+N', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 'n', ctrl: true, handler }]));
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should call handler on Ctrl+S with meta alternative', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 's', meta: true, handler }]));
    fireEvent.keyDown(window, { key: 's', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should NOT call handler on key mismatch', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 'n', ctrl: true, handler }]));
    fireEvent.keyDown(window, { key: 'x', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should NOT call handler when Ctrl missing', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 'n', ctrl: true, handler }]));
    fireEvent.keyDown(window, { key: 'n' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler on Shift+Ctrl+P', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 'P', shift: true, ctrl: true, handler }]));
    fireEvent.keyDown(window, { key: 'P', ctrlKey: true, shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should skip when enabled is false', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 's', ctrl: true, handler, enabled: false }]));
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler when enabled is true', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 's', ctrl: true, handler, enabled: true }]));
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple shortcuts', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    renderHook(() => useKeyboardShortcuts([
      { key: 'a', ctrl: true, handler: h1 },
      { key: 'b', ctrl: true, handler: h2 },
    ]));
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should prevent default on match', () => {
    renderHook(() => useKeyboardShortcuts([{ key: 's', ctrl: true, handler }]));
    const ev = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });
    const prevented = vi.spyOn(ev, 'preventDefault');
    window.dispatchEvent(ev);
    expect(prevented).toHaveBeenCalled();
  });

  it('should register and cleanup event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts([{ key: 'n', ctrl: true, handler }]));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});


