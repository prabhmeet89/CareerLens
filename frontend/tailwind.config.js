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
          blue:          'var(--color-accent)',
          'blue-hover':  'var(--color-accent-hover)',
          'blue-light':  'var(--color-accent-light)',
          'blue-border': 'var(--color-accent-border)',

          // ── Page canvas & surfaces ─────────────────────────────────────────
          bg:            'var(--color-bg)',
          card:          'var(--color-card)',
          inset:         'var(--color-inset)',

          // ── Borders ────────────────────────────────────────────────────────
          border:        'var(--color-border)',
          'border-light':'var(--color-border-light)',

          // ── Text ───────────────────────────────────────────────────────────
          'text-primary':   'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted':     'var(--color-text-muted)',

          // ── Semantic states ────────────────────────────────────────────────
          green:         'var(--color-green)',
          'green-bg':    'var(--color-green-bg)',
          amber:         'var(--color-amber)',
          'amber-bg':    'var(--color-amber-bg)',

          // ── NEW: Purple (Roadmap accent — Source C) ────────────────────────
          purple:        'var(--color-purple)',
          'purple-bg':   'var(--color-purple-bg)',

          // ── NEW: Danger / Red (destructive states — Source D) ─────────────
          danger:        'var(--color-danger)',
          'danger-bg':   'var(--color-danger-bg)',
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
