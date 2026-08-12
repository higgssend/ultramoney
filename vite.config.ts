import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
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
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
                  return 'pdf-engine';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                if (id.includes('recharts') || id.includes('d3')) {
                  return 'charts';
                }
                if (id.includes('@insforge/sdk')) {
                  return 'insforge-db';
                }
                if (id.includes('gsap')) {
                  return 'animations';
                }
                return 'vendor';
              }
              if (id.includes('/pages/')) {
                if (id.includes('LoanDetail') || id.includes('LoanRequest') || id.includes('Loans')) {
                  return 'page-loans';
                }
                if (id.includes('ClientDetail') || id.includes('Clients') || id.includes('NewClient')) {
                  return 'page-clients';
                }
                if (id.includes('Accounting') || id.includes('DeepAccounting') || id.includes('BankAccountsPage')) {
                  return 'page-accounting';
                }
                return 'page-other';
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
