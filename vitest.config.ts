import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'forks',
    minWorkers: 1,
    maxWorkers: 2,
    testTimeout: 10_000,
    hookTimeout: 10_000,
    teardownTimeout: 5_000,
  },
});
