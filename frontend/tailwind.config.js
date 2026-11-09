/**
 * ФРИПЕТ — design tokens для Tailwind.
 *
 * Все цвета берутся из CSS-переменных, объявленных в src/app/globals.css.
 * Поэтому светлая тема не требует ни одного переопределения конкретной
 * утилиты: меняется значение переменной — меняется и класс.
 * Компоненты ссылаются только на семантический уровень (surface/content/accent/
 * success/warning/danger/line/focus), как требует better-colors.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0',
      sm: '0.5rem', /* 8 */
      DEFAULT: '0.625rem', /* 10 */
      md: '0.75rem', /* 12 */
      lg: '1rem', /* 16 */
      full: '9999px',
    },
    extend: {
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        surface: {
          page: 'var(--surface-page)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          overlay: 'var(--surface-overlay)',
          field: 'var(--surface-field)',
          nav: 'var(--surface-nav)',
          veil: 'var(--surface-veil)',
        },
        content: {
          primary: 'var(--content-primary)',
          secondary: 'var(--content-secondary)',
          muted: 'var(--content-muted)',
          faint: 'var(--content-faint)',
          inverse: 'var(--content-inverse)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          on: 'var(--accent-on)',
          text: 'var(--accent-text)',
          line: 'var(--accent-line)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          soft: 'var(--highlight-soft)',
          text: 'var(--highlight-text)',
          line: 'var(--highlight-line)',
        },
        success: {
          DEFAULT: 'var(--success)',
          hover: 'var(--success-hover)',
          soft: 'var(--success-soft)',
          on: 'var(--success-on)',
          text: 'var(--success-text)',
          line: 'var(--success-line)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          hover: 'var(--warning-hover)',
          soft: 'var(--warning-soft)',
          on: 'var(--warning-on)',
          text: 'var(--warning-text)',
          line: 'var(--warning-line)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: 'var(--danger-hover)',
          soft: 'var(--danger-soft)',
          on: 'var(--danger-on)',
          text: 'var(--danger-text)',
          line: 'var(--danger-line)',
        },
        info: {
          DEFAULT: 'var(--info)',
          hover: 'var(--info-hover)',
          soft: 'var(--info-soft)',
          on: 'var(--info-on)',
          text: 'var(--info-text)',
          line: 'var(--info-line)',
        },
        line: {
          DEFAULT: 'var(--hairline)',
          strong: 'var(--hairline-strong)',
          input: 'var(--border-input)',
        },
        focus: 'var(--focus-ring)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        focus: '0 0 0 2px var(--accent-glow)',
      },
      transitionTimingFunction: {
        press: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'frpet-enter': {
          from: { opacity: '0', filter: 'blur(4px)', transform: 'translateY(12px)' },
          to: { opacity: '1', filter: 'blur(0)', transform: 'translateY(0)' },
        },
        'frpet-shimmer': {
          '0%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0 50%' },
        },
      },
      animation: {
        enter: 'frpet-enter 300ms cubic-bezier(0.2, 0, 0, 1) forwards',
        shimmer: 'frpet-shimmer 1.4s ease infinite',
      },
    },
  },
  plugins: [],
};
