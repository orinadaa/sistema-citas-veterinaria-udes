import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// El plugin de Tailwind se encarga de generar el CSS automaticamente.
// El proxy redirige las peticiones "/api/..." del frontend hacia el
// backend (puerto 4000), para no tener problemas de CORS en desarrollo.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});