import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'panel' | 'glass';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: Variant;
}

// 'panel' and 'glass' variants are now both glassmorphic. 'glass' has a slightly
// stronger backing opacity and gradient accents.
const VARIANT_CLASSES: Record<Variant, string> = {
  panel:
    'relative overflow-hidden bg-base-panel/30 backdrop-blur-glass border border-white/[0.1] shadow-glass before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:via-transparent before:to-white/[0.04]',
  glass:
    'relative overflow-hidden bg-base-panel/45 backdrop-blur-glass border border-white/[0.12] shadow-glass before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] before:via-transparent before:to-accent-cyan/[0.06]',
};

export function Card({ className = '', variant = 'glass', ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-2xl p-5 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
