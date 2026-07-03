import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
    minWorkers: 1,
    maxWorkers: 2,
    testTimeout: 10_000,
    hookTimeout: 10_000,
    teardownTimeout: 5_000,
  },
});
