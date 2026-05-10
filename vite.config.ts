import { readFileSync } from 'node:fs';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJSON = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  define: {
    __APP_VERSION__: JSON.stringify(packageJSON.version),
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
    port: mode === 'e2e' ? 3000 : undefined,
    allowedHosts: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/index.css',
        'src/types.ts',
        'src/components/Field/**/*',
        'src/config/hero.ts',
        'src/utils/firebase.ts',
      ],
    },
    exclude: ['node_modules/**', 'dist/**', 'e2e/**', 'cloud-functions/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/__setup__/vitest.setup.ts'],
    server: {
      deps: {
        inline: [/@heroui\//],
      },
    },
  },
  build: {
    sourcemap: true,
  },
}));
