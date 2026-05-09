import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'src/__tests__/i18n-types.test.ts', 'src/__tests__/format.test.ts'],
    globals: true,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // 'server-only' is a Next.js sentinel that throws when imported by
      // client code. In tests we just want it to be a no-op so the import
      // graph continues to load.
      'server-only': resolve(__dirname, './src/__tests__/__mocks__/server-only.ts'),
    },
  },
});
