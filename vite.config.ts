import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import apiApp from './server/api.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(apiApp);
      }
    }
  ],
  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: [
        '**/video/**',
        '**/Music/**',
        '**/picture/**',
        '**/scratch*/**',
        '**/.git/**',
        '**/*.mp4',
        '**/*.mp3',
        '**/*.wav',
        '**/*.mov',
        '**/*.avi',
        '**/*.ttf',
        '**/*.otf',
        '**/*.woff*',
        '**/*.docx',
        '**/*.xlsx',
        '**/*.pdf',
        '**/*.zip'
      ]
    }
  }
});
