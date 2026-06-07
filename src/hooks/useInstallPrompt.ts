import { useState, useEffect, useCallback } from "react";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}

/**
 * Captures the beforeinstallprompt event and provides a way to trigger installation.
 *
 * - If beforeinstallprompt fires (PWA criteria met: HTTPS + SW + manifest), install() calls prompt().
 * - If it doesn't fire (dev mode, HTTP, etc.), install() opens a helper dialog instead.
 */
export function useInstallPrompt(): {
  installable: boolean;
  install: () => void;
  isNativePrompt: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
} {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [fallbackVisible, setFallbackVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setFallbackVisible(false);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // If beforeinstallprompt doesn't fire within 3s, show fallback
    const timer = setTimeout(() => {
      if (!deferredPrompt) setFallbackVisible(true);
    }, 3000);

    // Track if app is already installed
    if (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) {
      setFallbackVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | null
  > => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const install = useCallback(() => {
    if (deferredPrompt) {
      promptInstall();
    } else {
      // Fallback: dispatch custom event to open the install helper dialog
      window.dispatchEvent(new CustomEvent("hkinv:show-install-help"));
    }
  }, [deferredPrompt, promptInstall]);

  const installable = !!deferredPrompt || fallbackVisible;

  return {
    installable,
    install,
    isNativePrompt: !!deferredPrompt,
    promptInstall,
  };
}
