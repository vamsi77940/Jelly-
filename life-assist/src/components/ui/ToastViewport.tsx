import { useUIStore } from '@/store/useUIStore';

const TONE_CLASSES = {
  default: 'border-white/[0.08]',
  success: 'border-accent-mint/40 bg-accent-mint/10',
  warning: 'border-accent-amber/40 bg-accent-amber/10',
};

export function ToastViewport() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-fadeUp bg-base-panel/85 backdrop-blur-glass border ${TONE_CLASSES[toast.tone]} shadow-glass rounded-xl px-4 py-3 text-sm text-ink-primary max-w-xs relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.04] before:via-transparent before:to-white/[0.02]`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
