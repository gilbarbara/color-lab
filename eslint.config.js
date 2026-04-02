import config from '@gilbarbara/eslint-config';
import vitest from '@gilbarbara/eslint-config/vitest';
import testingLibrary from '@gilbarbara/eslint-config/testing-library';
import playwright from 'eslint-plugin-playwright';


export default [
  ...config,
  ...vitest,
  ...testingLibrary,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    rules: {
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    },
  },
  {
    files: ['e2e/*.spec.*'],
    ...playwright.configs['flat/recommended'],
    rules: {
      'testing-library/prefer-screen-queries': 'off',
    },
  },
];
