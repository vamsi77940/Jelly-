import { type ReactNode, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent-cyan text-base-bg hover:brightness-110 shadow-glow font-medium',
  secondary:
    'bg-white/5 border border-white/10 text-ink-primary hover:bg-white/10 hover:border-white/20 backdrop-blur-md',
  ghost: 'bg-transparent text-ink-muted hover:text-ink-primary hover:bg-white/5',
  danger: 'bg-transparent text-accent-rose hover:bg-accent-rose/10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', icon, className = '', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {icon}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
