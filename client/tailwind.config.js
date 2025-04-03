/* eslint-disable no-undef */
module.exports = {
  content: ['./public/*.html', './src/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    minWidth: {
      min: '420px',
    },
    container: {
      center: true,
    },
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      sxl: '1242px',
      xl: '1440px',
    },
    colors: {
      white: '#FFFFFF',
      grey: '#808080',
      black: '#000000',
      'bcgov-white': '#F5F5F4',
      'bcgov-blue': '#003366',
      'bcgov-gold': '#FCBA19',
      'bcgov-black': '#202223',
      'bcgov-lightgrey': '#E5E5E5',
      'bcgov-darkgrey': '#3A3B3B',
    },
    fontFamily: {
      sans: ['montserrat', 'sans-serif'],
    },
    extend: {
      transitionProperty: {
        height: 'height',
      },
    },
  },
}
