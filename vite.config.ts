import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools';


export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      // SPA fallback - ensures all routes serve index.html for client-side routing
      appType: 'spa' as const,
      plugins: [react(), tailwindcss(), imagetools()],
      // API keys are kept server-side only - never exposed to frontend
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
