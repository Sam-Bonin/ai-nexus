import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // New Brand Colors
        'electric-yellow': '#FFD50F',
        'vibrant-coral': '#FD765B',
        'pure-black': '#000000',
        'dark-gray': '#1A1A1A',
        'pure-white': '#FFFFFF',
        'neutral-gray': '#999999',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        'black': '900',
        'extrabold': '800',
        'bold': '700',
        'semibold': '600',
        'medium': '500',
        'regular': '400',
        'light': '300',
      },
      fontSize: {
        'hero': ['96px', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'phase': ['72px', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'section': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'phase-title': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'subtitle': ['22px', { lineHeight: '1.5' }],
        'body': ['18px', { lineHeight: '1.8' }],
        'nav': ['14px', { lineHeight: '1.6' }],
        'label': ['12px', { lineHeight: '1.6', letterSpacing: '2px' }],
        'micro': ['11px', { lineHeight: '1.6', letterSpacing: '2px' }],
        'tiny': ['10px', { lineHeight: '1.6', letterSpacing: '8px' }],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.02em',
        'wide': '2px',
        'wider': '8px',
      },
      lineHeight: {
        'compressed': '0.9',
        'tight': '1.2',
        'normal': '1.5',
        'comfortable': '1.6',
        'relaxed': '1.8',
      },
      borderRadius: {
        'claude-sm': '8px',
        'claude-md': '12px',
        'claude-lg': '16px',
      },
      boxShadow: {
        'claude-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'claude-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'claude-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};
export default config;