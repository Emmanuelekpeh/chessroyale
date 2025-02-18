import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/tests/setup.ts'],
    include: ['./server/tests/**/*.test.ts'],
    hookTimeout: 120000,  // Increase hook timeout to 120 seconds
    testTimeout: 60000,   // Set test timeout to 60 seconds
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
});