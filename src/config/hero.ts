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
          50: '#f5f5f5',
          100: '#ebebeb',
          200: '#dadada',
          300: '#c4c4c4',
          400: '#ababab',
          500: '#8f8f8f',
          600: '#727272',
          700: '#535353',
          800: '#343434',
          900: '#161616',
          DEFAULT: '#343434',
          foreground: '#fff',
        },
        secondary: {
          50: '#eff6ff',
          100: '#d4e6ff',
          200: '#accfff',
          300: '#7bb3ff',
          400: '#4092ff',
          500: '#0067ff',
          600: '#0056e8',
          700: '#0041b3',
          800: '#00297a',
          900: '#00113f',
          DEFAULT: '#0067ff',
          foreground: '#fff',
        },
      },
    },
    dark: {
      colors: {
        primary: {
          50: '#161616',
          100: '#1c1c1c',
          200: '#292929',
          300: '#3a3a3a',
          400: '#4f4f4f',
          500: '#686868',
          600: '#868686',
          700: '#a7a7a7',
          800: '#cccccc',
          900: '#f5f5f5',
          DEFAULT: '#cccccc',
          foreground: '#000',
        },
        secondary: {
          50: '#00113f',
          100: '#001a55',
          200: '#002978',
          300: '#003aa3',
          400: '#004ed5',
          500: '#0067ff',
          600: '#2184ff',
          700: '#68a8ff',
          800: '#aaceff',
          900: '#eff6ff',
          DEFAULT: '#0067ff',
          foreground: '#fff',
        },
      },
    },
  },
});
