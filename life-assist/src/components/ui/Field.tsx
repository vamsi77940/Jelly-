import { type ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint backdrop-blur-md focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-accent-cyan/60 focus:border-accent-cyan/60 transition-all';
