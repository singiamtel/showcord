/** @type {import('tailwindcss').Config} */
	module.exports = {
		content: [
			'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
			'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
			'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		],
		theme: {
			colors: {
				primary: '#0F4C81',
				secondary: '#F2F2F2',
				white: '#FFFFFF',
				black: '#000000',
				blue: {
					100: '#5865F2',
					200: '#404EED',
				},
				gray: {
					100: '#F6F6F6',
					200: '#99AAB5',
					300: '#313338',
					400: '#23272A',
					500: '#BDBDBD',
				},
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				serif: ['Inter', 'sans-serif'],
				mono: ['Inter', 'sans-serif'],
			},
		},
		plugins: [],
	}
