import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // required — becomes aria-label, never optional
  icon: ReactNode;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, active = false, className = '', ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-[colors,transform] active:scale-90 focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 ${
        active ? 'bg-accent-cyanSoft text-accent-cyan' : 'text-ink-muted hover:text-ink-primary hover:bg-base-raised'
      } ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
);
IconButton.displayName = 'IconButton';
