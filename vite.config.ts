import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    sentryVitePlugin({
      org: 'kollectiv',
      project: 'color-lab',
    }),
  ],

  server: {
    host: true,
    open: true,
    port: 3000,
    allowedHosts: true,
  },

  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 5,
        branches: 5,
        functions: 5,
        lines: 5,
      },
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/index.css',
        'src/types.ts',
        'src/config/hero.ts',
      ],
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/__setup__/vitest.setup.ts'],
  },

  build: {
    sourcemap: true,
  },
});
