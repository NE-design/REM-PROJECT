import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surf: 'var(--surf)', ink: 'var(--ink)', mut: 'var(--mut)', line: 'var(--line)',
        acc: 'var(--acc)', accx: 'var(--accx)', warn: 'var(--warn)', ok: 'var(--ok)',
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
