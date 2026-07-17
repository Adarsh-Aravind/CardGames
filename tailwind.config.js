/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: '#c7f9cc',
        spring: '#80ed99',
        jade: '#57cc99',
        teal: '#38a3a5',
        navy: '#22577a',
        // Derived shades for depth — same hue family as the palette above.
        ink: '#0d2b3e',
        abyss: '#081c29',
        frost: '#f1fff4',
      },
      boxShadow: {
        'card': '0 10px 30px -10px rgba(13, 43, 62, 0.45)',
        'card-hover': '0 22px 45px -12px rgba(13, 43, 62, 0.6)',
        'glow': '0 0 0 0 rgba(128, 237, 153, 0.7)',
        'inset-top': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(10px)' },
          '60%': { opacity: '1', transform: 'scale(1.03) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'deal': {
          '0%': { opacity: '0', transform: 'translateY(60px) rotate(-8deg) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0) scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(128, 237, 153, 0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(128, 237, 153, 0)' },
        },
        'shuffle-card': {
          '0%, 100%': { transform: 'translateX(0) translateY(0) rotate(-6deg)', zIndex: '1' },
          '25%': { transform: 'translateX(28px) translateY(-14px) rotate(8deg)', zIndex: '3' },
          '50%': { transform: 'translateX(0) translateY(-4px) rotate(0deg)', zIndex: '2' },
          '75%': { transform: 'translateX(-28px) translateY(-14px) rotate(-10deg)', zIndex: '1' },
        },
        'tilt': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'rise': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'pop-in': 'pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'deal': 'deal 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer': 'shimmer 2.2s linear infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-out infinite',
        'shuffle-card': 'shuffle-card 3s ease-in-out infinite',
        'tilt': 'tilt 6s ease-in-out infinite',
        'rise': 'rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
}
