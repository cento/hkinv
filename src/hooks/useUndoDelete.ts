import { useState, useCallback, useRef } from 'react';

interface UndoState<T> {
  item: T;
  timer: ReturnType<typeof setTimeout> | null;
}

export function useUndoDelete<T>(
  onRestore: (item: T) => Promise<void>
) {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const undoRef = useRef<UndoState<T> | null>(null);

  const scheduleUndo = useCallback((item: T, label: string) => {
    // Clear any previous undo timer
    if (undoRef.current?.timer) {
      clearTimeout(undoRef.current.timer);
    }
    const timer = setTimeout(() => {
      undoRef.current = null;
    }, 5000);
    undoRef.current = { item, timer };
    setSnackbar({ open: true, message: label });
  }, []);

  const handleUndo = useCallback(async () => {
    const state = undoRef.current;
    if (!state) return;
    if (state.timer) clearTimeout(state.timer);
    undoRef.current = null;
    setSnackbar({ open: false, message: '' });
    await onRestore(state.item);
  }, [onRestore]);

  const closeSnackbar = useCallback(() => {
    setSnackbar(s => ({ ...s, open: false }));
  }, []);

  return { snackbar, scheduleUndo, handleUndo, closeSnackbar };
}
