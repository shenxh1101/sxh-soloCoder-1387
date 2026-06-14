/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'pixel-bg': '#1a1b2e',
        'pixel-surface': '#252640',
        'pixel-surface-light': '#2d2f4d',
        'pixel-border': '#3d3f66',
        'pixel-primary': '#a855f7',
        'pixel-primary-hover': '#c084fc',
        'pixel-accent': '#2dd4bf',
        'pixel-accent-hover': '#5eead4',
        'pixel-warning': '#f59e0b',
        'pixel-danger': '#f87171',
        'pixel-text': '#e2e8f0',
        'pixel-text-muted': '#94a3b8',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'pixel': '4px 4px 0 0 rgba(0, 0, 0, 0.3)',
        'pixel-sm': '2px 2px 0 0 rgba(0, 0, 0, 0.3)',
        'pixel-inset': 'inset 2px 2px 0 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
