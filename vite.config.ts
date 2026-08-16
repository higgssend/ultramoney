import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: false, // Uses public/manifest.json
          workbox: {
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            navigateFallbackDenylist: [/^\/api/, /^https:\/\/.*\.insforge\.app/]
          }
        }),
        viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
      ],
      build: {
        sourcemap: false, // Ensure source maps are NOT exposed in production
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
                  return 'pdf-engine';
                }
                if (id.includes('recharts') || id.includes('d3')) {
                  return 'charts';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                return 'vendor';
              }
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
