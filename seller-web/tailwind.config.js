/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Montserrat'
  			],
  			lexend: [
  				'Lexend'
  			],
  			cabin: [
  				'Cabin'
  			]
  		},
  		height: {
  			screen: '100dvh'
  		},
  		screens: {
  			'3xl': '1583px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {},
  		keyframes: {
  			loading: {
  				'20%': {
  					backgroundPosition: '0% 0%, 50% 50%, 100% 50%'
  				},
  				'40%': {
  					backgroundPosition: '0% 100%, 50% 0%, 100% 50%'
  				},
  				'60%': {
  					backgroundPosition: '0% 50%, 50% 100%, 100% 0%'
  				},
  				'80%': {
  					backgroundPosition: '0% 50%, 50% 50%, 100% 100%'
  				}
  			}
  		},
  		animation: {
  			loading: 'loading 1s infinite linear'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

