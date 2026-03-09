import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'


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
      plugins: [react(), tailwindcss()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-framer': ['framer-motion'],
              'vendor-styled': ['styled-components'],
              'vendor-export': ['html-to-image'],
            },
          },
        },
      },
      // API keys are kept server-side only - never exposed to frontend
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
