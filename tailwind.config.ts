import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        negro: '#080808',
        carbon: '#111111',
        coral: '#E8430A',
        turquesa: '#2ABFBF',
        azul: '#0D3B5E',
        arena: '#D4C5A9',
        blanco: '#F7F3EE',
        oro: '#C9A84C',
        limon: '#DEFD6F',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-space)', 'sans-serif'],
      },
      backgroundImage: {
        'luxury-dots': 'radial-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px)',
        'rule-gold': 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
        'glow-oro': 'radial-gradient(circle at top right, rgba(201, 168, 76, 0.12), transparent 70%)',
        'ocean-blob': 'radial-gradient(circle at top right, rgba(13, 59, 94, 0.8) 0%, transparent 60%)',
        'coral-blob': 'radial-gradient(circle at bottom left, rgba(232, 67, 10, 0.35) 0%, transparent 60%)',
        'turquesa-blob': 'radial-gradient(circle at top right, rgba(42, 191, 191, 0.3) 0%, transparent 60%)',
        'limon-blob': 'radial-gradient(circle at top right, rgba(222, 253, 111, 0.25) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}
export default config
