import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/index.css',
        'src/types.ts',
        'src/components/Field/**/*',
        'src/containers/Generator/index.tsx',
        'src/containers/Palette/index.tsx',
        'src/config/hero.ts',
        'src/hooks/useGeneratorStore.ts',
        'src/utils/firebase*.ts',
      ],
    },
    exclude: ['node_modules/**', '.next/**', 'e2e/**', 'cloud-functions/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/__setup__/vitest.setup.ts'],
    server: {
      deps: {
        inline: [/@heroui\//],
      },
    },
  },
});
