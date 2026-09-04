import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:4000',
        bypass: (req) => (req.headers.accept?.includes('text/html') ? '/index.html' : undefined)
      },
      '/chat': 'http://localhost:4000'
    }
  }
});
