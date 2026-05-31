import { useState, useEffect, useCallback } from 'react';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}

/**
 * Captures the beforeinstallprompt event and provides a way to trigger installation.
 * In dev mode (no SW), shows install button after a short delay so user can still install via Chrome menu.
 * Returns { installable, install } — call install() when user clicks the install button.
 */
export function useInstallPrompt(): { installable: boolean; install: () => void } {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowFallback(false);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: if beforeinstallprompt doesn't fire within 3 seconds,
    // show the install button anyway (useful in dev mode or when SW is disabled)
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const install = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      // Fallback: tell user to use Chrome menu → Install
      alert('Click the ⋮ menu in Chrome and select "Install HK Invoice Manager..."');
    }
  }, [deferredPrompt]);

  const installable = !!deferredPrompt || showFallback;

  return { installable, install };
}
