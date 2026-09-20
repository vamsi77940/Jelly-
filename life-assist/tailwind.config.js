/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep OLED base palette for a premium visionOS/Linear feel.
        base: {
          bg: 'var(--color-base-bg)',
          panel: 'var(--color-base-panel)',
          raised: 'var(--color-base-raised)',
          border: 'var(--color-base-border)',
        },
        ink: {
          primary: 'var(--color-ink-primary)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
        },
        accent: {
          cyan: 'var(--color-accent-cyan)',
          cyanSoft: 'var(--color-accent-cyan-soft)',
          amber: 'var(--color-accent-amber)',
          amberSoft: 'var(--color-accent-amber-soft)',
          rose: 'var(--color-accent-rose)',
          mint: 'var(--color-accent-mint)',
          indigo: 'var(--color-accent-indigo)',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'], // Replacing Space Grotesk with Inter for sleek Apple-like UI
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79,209,232,0.25), 0 0 24px rgba(79,209,232,0.15)',
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
        // Layered depth for the frosted-glass surface: inner top highlight
        // (reads as a curved specular edge, the visionOS/Liquid Glass cue),
        // a faint inner base shadow for thickness, and a soft outer drop
        // shadow so glass panels visibly float above the page.
        glass:
          '0 1px 0 rgba(255,255,255,0.09) inset, 0 -1px 12px rgba(0,0,0,0.25) inset, 0 12px 32px rgba(0,0,0,0.45)',
      },
      backdropBlur: {
        glass: '20px',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Very slow specular drift across a glass surface — reinforces the
        // "liquid" read without being a distracting animation. Purely
        // decorative, so it's covered by the existing reduced-motion query.
        sheen: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        breathe: 'breathe 3.2s ease-in-out infinite',
        // 'backwards' fill-mode: elements hold their from-keyframe state
        // (opacity 0) during animation-delay instead of flashing visible
        // then jumping back — needed for the new list-stagger utility below,
        // harmless for existing zero-delay usages.
        fadeUp: 'fadeUp 0.3s ease-out backwards',
        sheen: 'sheen 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
