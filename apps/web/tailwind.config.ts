import type { Config } from 'tailwindcss';
export default { darkMode: 'class', content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { enterprise: { 950: '#07111f', 900: '#0b172a', 500: '#2f6fed' } } } }, plugins: [] } satisfies Config;
