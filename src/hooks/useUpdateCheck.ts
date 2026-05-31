import { useState, useEffect, useCallback } from 'react';

/**
 * Checks for service worker updates.
 * When an update is available and installed, returns { updateReady: true }.
 * Call update() to apply the update (reloads the page).
 */
export function useUpdateCheck(): { updateReady: boolean; update: () => void } {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Check if there's a waiting worker already
        if (reg.waiting) {
          setUpdateReady(true);
          setWaitingWorker(reg.waiting);
        }

        // Listen for new waiting worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
              setWaitingWorker(newWorker);
            }
          });
        });
      } catch { /* SW not available */ }
    };

    checkUpdate();

    // Also check on interval (every 5 minutes)
    const interval = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      } catch { /* ignore update check errors */ }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const update = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  return { updateReady, update };
}
