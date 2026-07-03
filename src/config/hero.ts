import { heroui } from '@heroui/react';

export default heroui({
  layout: {
    radius: {
      small: '4px',
      medium: '6px',
      large: '10px',
    },
  },
  themes: {
    light: {
      colors: {
        primary: {
          50: '#f6f5f1',
          100: '#e8e8e4',
          200: '#d5d4d0',
          300: '#bebeba',
          400: '#a6a5a2',
          500: '#8d8c89',
          600: '#73726f',
          700: '#585754',
          800: '#3e3d3a',
          900: '#252421',
          DEFAULT: '#3e3d3a',
          foreground: '#fff',
        },
        secondary: {
          50: '#eff6ff',
          100: '#d5e6ff',
          200: '#aeceff',
          300: '#80b1ff',
          400: '#4b8fff',
          500: '#1269f8',
          600: '#015ae1',
          700: '#0045bf',
          800: '#002f95',
          900: '#001965',
          DEFAULT: '#0067ff',
          foreground: '#fff',
        },
      },
    },
    dark: {
      colors: {
        primary: {
          50: '#252421',
          100: '#3e3d3a',
          200: '#585754',
          300: '#73726f',
          400: '#8d8c89',
          500: '#a6a5a2',
          600: '#bebeba',
          700: '#d5d4d0',
          800: '#e8e8e4',
          900: '#f6f5f1',
          DEFAULT: '#e8e8e4',
          foreground: '#000',
        },
        secondary: {
          '50': '#001965',
          '100': '#002f95',
          '200': '#0045bf',
          '300': '#015ae1',
          '400': '#1269f8',
          '500': '#4b8fff',
          '600': '#80b1ff',
          '700': '#aeceff',
          '800': '#d5e6ff',
          '900': '#eff6ff',
          DEFAULT: '#0067ff',
          foreground: '#fff',
        },
      },
    },
  },
});
