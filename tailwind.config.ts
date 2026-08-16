import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				text: 'var(--text)',
				'text-dim': 'var(--text-dim)',
				accent: 'var(--accent)',
				base: 'var(--bg)',
				raised: 'var(--bg-raised)',
				border: 'var(--border)'
			},
			fontFamily: {
				sans: ['var(--prose)'],
				pixel: ['var(--pixel)']
			}
		}
	},

	plugins: [typography, containerQueries]
} satisfies Config;
