import { useEffect } from 'react';

declare global {
  interface LaunchParams {
    files: FileSystemFileHandle[];
  }
  interface LaunchQueue {
    setConsumer(consumer: (launchParams: LaunchParams) => void): void;
  }
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

/**
 * Listens for file launches (double-click .hkinv in Explorer → opens PWA).
 * Calls onFile with the file handle when a launch occurs.
 */
export function useFileHandler(onFile: (handle: FileSystemFileHandle) => Promise<void>) {
  useEffect(() => {
    if ('launchQueue' in window && window.launchQueue) {
      window.launchQueue.setConsumer(async (launchParams: LaunchParams) => {
        if (launchParams.files && launchParams.files.length > 0) {
          await onFile(launchParams.files[0]);
        }
      });
    }
  }, [onFile]);
}
