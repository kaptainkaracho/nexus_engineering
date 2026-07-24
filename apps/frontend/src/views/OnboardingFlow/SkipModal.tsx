import { useState, useEffect, useRef, useId } from 'react';
import { Button } from '@nexus-engineering/shared';
import { AlertTriangle, X } from 'lucide-react';

interface SkipModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dontAskAgain: boolean) => void;
}

export function SkipModal({ open, onClose, onConfirm }: SkipModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const stayBtnId = useId();

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const el = document.getElementById(stayBtnId);
        el?.focus();
      }, 50);
    }
  }, [open, stayBtnId]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-labelledby="skip-modal-title">
      <div ref={modalRef} className="bg-surface-primary rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center text-warning-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 id="skip-modal-title" className="text-lg font-semibold text-text-primary">
              Skip onboarding?
            </h2>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-6">
          You can access all settings later from your account settings.
        </p>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="dont-ask"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="dont-ask" className="text-sm text-text-secondary">
            Don't ask me again
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} id={stayBtnId}>
            Stay
          </Button>
          <Button variant="primary" onClick={() => onConfirm(dontAskAgain)}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
