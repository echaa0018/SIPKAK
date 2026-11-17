import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5181,
    strictPort: true,
    // A dedicated API port prevents old and new SIPKAK instances from being mixed.
    proxy: { '/api': 'http://localhost:3011' },
  },
  test: { environment: 'jsdom' },
});
