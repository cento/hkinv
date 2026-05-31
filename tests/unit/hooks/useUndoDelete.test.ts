import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoDelete } from '../../../src/hooks/useUndoDelete';

describe('useUndoDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules undo and shows snackbar', () => {
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoDelete(onRestore));

    act(() => {
      result.current.scheduleUndo({ id: 1, name: 'Test' }, 'Deleted ✓');
    });

    expect(result.current.snackbar.open).toBe(true);
    expect(result.current.snackbar.message).toBe('Deleted ✓');
  });

  it('calls onRestore when undo is clicked', async () => {
    const onRestore = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useUndoDelete(onRestore));

    act(() => {
      result.current.scheduleUndo({ id: 1, name: 'Test' }, 'Deleted');
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(onRestore).toHaveBeenCalledWith({ id: 1, name: 'Test' });
    expect(result.current.snackbar.open).toBe(false);
  });

  it('clears undo after 5 seconds', () => {
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoDelete(onRestore));

    act(() => {
      result.current.scheduleUndo({ id: 1 }, 'Gone');
    });

    expect(result.current.snackbar.open).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // After timeout, undo should be cleared but snackbar remains open (autoHideDuration handles it)
    // The undo ref is cleared, so calling handleUndo should be a no-op
  });

  it('closes snackbar', () => {
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoDelete(onRestore));

    act(() => {
      result.current.scheduleUndo({ id: 1 }, 'Test');
    });

    act(() => {
      result.current.closeSnackbar();
    });

    expect(result.current.snackbar.open).toBe(false);
  });

  it('handles undo when no item is scheduled', async () => {
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoDelete(onRestore));

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(onRestore).not.toHaveBeenCalled();
  });
});
