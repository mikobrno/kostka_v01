import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.ttf', '**/*.otf'],
  optimizeDeps: {
  exclude: ['lucide-react'],
  include: ['@pdf-lib/fontkit'],
  },
  build: {
    rollupOptions: {
      external: ['draft-js'],
    },
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
  // Neprovádějte rewrite – Netlify dev očekává prefix '/.netlify/functions'
  // takže požadavek zůstane jako '/.netlify/functions/<fn>'
      },
    },
  },
});
