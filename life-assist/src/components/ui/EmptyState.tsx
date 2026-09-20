import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-3xl border border-white/[0.08] bg-base-panel/40 backdrop-blur-glass shadow-glass relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.06] before:via-transparent before:to-accent-cyan/[0.04]">
      <div className="relative mb-5 flex items-center justify-center">
        {/* Ambient breathing wisp glow behind the icon matching the reference image */}
        <div className="absolute inset-0 bg-accent-cyan/35 rounded-full blur-2xl opacity-75 scale-150 animate-breathe pointer-events-none" />
        <div className="relative p-4 rounded-2xl bg-white/10 border border-white/15 text-white shadow-inner backdrop-blur-md">
          {icon}
        </div>
      </div>
      <p className="font-display font-medium text-lg text-ink-primary mb-2 tracking-tight relative z-10">{title}</p>
      <p className="text-sm text-ink-muted max-w-sm leading-relaxed relative z-10">{hint}</p>
    </div>
  );
}
