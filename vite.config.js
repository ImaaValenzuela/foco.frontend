import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    {
      name: 'foco-clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/mi-cuenta') {
            req.url = '/mi-cuenta.html';
          } else if (req.url === '/login') {
            req.url = '/login.html';
          } else if (req.url === '/onboarding') {
            req.url = '/onboarding.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), 'index.html'),
        login: resolve(process.cwd(), 'login.html'),
        onboarding: resolve(process.cwd(), 'onboarding.html'),
        'mi-cuenta': resolve(process.cwd(), 'mi-cuenta.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
