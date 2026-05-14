/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      colors: {
        bg:      '#07080b',
        surface: '#0d1117',
        panel:   '#161b22',
        border:  '#21262d',
        border2: '#30363d',
        tx:      '#c9d1d9',
        tx2:     '#8b949e',
        tx3:     '#484f58',
        accent:  '#388bfd',
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'blink':   'blink 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
    },
  },
  plugins: [],
}
