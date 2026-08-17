/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0A66C2',
          'blue-hover': '#004182',
          'blue-light': '#EBF4FD',
          'blue-border': '#70B5F9',
          bg: '#F4F2EE',
          card: '#FFFFFF',
          border: '#E0DFDC',
          'border-light': '#EDEBE8',
          'text-primary': '#191919', // ~000000DE
          'text-secondary': '#666666', // ~00000099
          'text-muted': '#8C8C8C',
          green: '#057642',
          'green-bg': '#E8F5E9',
          amber: '#B25900',
          'amber-bg': '#FFF3E0',
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
        'linkedin-card': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'linkedin-dropdown': '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'linkedin-hover': '0 0 0 1px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'linkedin': '8px',
        'linkedin-lg': '10px',
      },
    },
  },
  plugins: [],
}
