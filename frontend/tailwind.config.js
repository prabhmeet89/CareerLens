/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        linkedin: {
          // ── Brand accent blue ──────────────────────────────────────────────
          blue:          'rgb(var(--color-accent) / <alpha-value>)',
          'blue-hover':  'rgb(var(--color-accent-hover) / <alpha-value>)',
          'blue-light':  'rgb(var(--color-accent-light) / <alpha-value>)',
          'blue-border': 'rgb(var(--color-accent-border) / <alpha-value>)',
          accent:        'rgb(var(--color-accent) / <alpha-value>)',
          'accent-hover':'rgb(var(--color-accent-hover) / <alpha-value>)',
          'accent-light':'rgb(var(--color-accent-light) / <alpha-value>)',
          'accent-border':'rgb(var(--color-accent-border) / <alpha-value>)',

          // ── Page canvas & surfaces ─────────────────────────────────────────
          bg:            'rgb(var(--color-bg) / <alpha-value>)',
          card:          'rgb(var(--color-card) / <alpha-value>)',
          inset:         'rgb(var(--color-inset) / <alpha-value>)',

          // ── Borders ────────────────────────────────────────────────────────
          border:        'rgb(var(--color-border) / <alpha-value>)',
          'border-light':'rgb(var(--color-border-light) / <alpha-value>)',

          // ── Text ───────────────────────────────────────────────────────────
          'text-primary':   'rgb(var(--color-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'text-muted':     'rgb(var(--color-text-muted) / <alpha-value>)',

          // ── Semantic states ────────────────────────────────────────────────
          green:         'rgb(var(--color-green) / <alpha-value>)',
          'green-bg':    'rgb(var(--color-green-bg) / <alpha-value>)',
          amber:         'rgb(var(--color-amber) / <alpha-value>)',
          'amber-bg':    'rgb(var(--color-amber-bg) / <alpha-value>)',

          // ── NEW: Purple (Roadmap accent — Source C) ────────────────────────
          purple:        'rgb(var(--color-purple) / <alpha-value>)',
          'purple-bg':   'rgb(var(--color-purple-bg) / <alpha-value>)',

          // ── NEW: Danger / Red (destructive states — Source D) ─────────────
          danger:        'rgb(var(--color-danger) / <alpha-value>)',
          'danger-bg':   'rgb(var(--color-danger-bg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      boxShadow: {
        'linkedin-card':     '0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'linkedin-dropdown': '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'linkedin-hover':    '0 0 0 1px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'linkedin':    '8px',
        'linkedin-lg': '10px',
      },
    },
  },
  plugins: [],
}
