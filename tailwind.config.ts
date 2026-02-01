import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': 'var(--neon-pink)',
        'neon-blue': 'var(--neon-blue)',
        'neon-green': 'var(--neon-green)',
        'neon-purple': 'var(--neon-purple)',
        'glow-pink': 'var(--glow-pink)',
        'glow-blue': 'var(--glow-blue)',
        'glow-green': 'var(--glow-green)',
      },
    },
  },
}

export default config
