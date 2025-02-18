import { useEffect } from 'react';

export function useShortcuts(callbacks: {
  onUndo?: () => void;
  onHint?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && callbacks.onUndo) {
          e.preventDefault();
          callbacks.onUndo();
        }
      } else {
        switch (e.key) {
          case 'h':
            callbacks.onHint?.();
            break;
          case 's':
            callbacks.onSkip?.();
            break;
          case 'n':
            callbacks.onNext?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callbacks]);
}