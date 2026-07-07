/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				'lfp-dark': '#0a0a0a',
				'lfp-green': '#2d5016',
				'lfp-accent': '#ff4d00',
				'lfp-amber': '#ffce47',
				'lfp-gray': '#1a1a1a',
			},
			fontFamily: {
				'display': ['Landasans', 'sans-serif'],
				'body': ['Landasans', 'sans-serif'],
				'landasans': ['Landasans', 'sans-serif'],
			},
		},
	},
	plugins: [],
}