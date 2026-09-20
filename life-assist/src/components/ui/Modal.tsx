import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, isOpen, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'input, textarea, select, button:not([disabled])'
    );
    // Focus the first field in the body content (e.g. the title input), not
    // the close button that happens to sit first in DOM order.
    const contentFocusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'input, textarea, select'
    );
    (contentFocusable?.[0] ?? focusable?.[0])?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeUp"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-2xl bg-base-panel/75 backdrop-blur-glass border border-white/[0.08] shadow-glass p-6 relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.06] before:via-transparent before:to-accent-cyan/[0.04]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-lg font-display font-semibold">
            {title}
          </h2>
          <IconButton label="Close dialog" icon={<X size={18} />} onClick={onClose} />
        </div>
        <div ref={contentRef} className="space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
