export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins'],
               
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
            colors: {
                primary: '#22c55e', // Tailwind green-500 (#22c55e)
            },
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
                },
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                }
            },
            animation: {
                loading: 'loading 1s infinite linear',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
