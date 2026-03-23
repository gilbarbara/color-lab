import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
  },
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
        'src/utils/appwrite.ts',
      ],
    },
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
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
});
