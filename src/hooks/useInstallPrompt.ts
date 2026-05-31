import { useState, useEffect } from 'react';

/**
 * Captures the beforeinstallprompt event and provides a way to trigger installation.
 * Returns { installable, install } — call install() when user clicks the install button.
 */
export function useInstallPrompt(): { installable: boolean; install: () => Promise<void> } {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    // If user dismissed the prompt, it's gone — Chrome won't show it again soon
    return outcome;
  };

  return { installable: !!deferredPrompt, install };
}
