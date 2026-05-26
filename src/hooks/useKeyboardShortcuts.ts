import { useEffect, useRef } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const sc of shortcutsRef.current) {
        if (sc.enabled === false) continue;

        const ctrlOrMeta = sc.ctrl || sc.meta;
        const matchCtrl = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true;
        const matchShift = sc.shift ? e.shiftKey : !e.shiftKey;
        const matchKey = e.key.toLowerCase() === sc.key.toLowerCase();

        if (matchKey && matchCtrl && matchShift) {
          e.preventDefault();
          sc.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}