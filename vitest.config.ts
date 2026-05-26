import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['tests/unit/setup.ts'],
    testTimeout: 10000,
    globals: true,
  },
});
