/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Compilacion de demostracion sin servidor (GitHub Pages), ver demo/publicar.mjs:
//   VITE_DEMO=1  usa la entrada main.demo.jsx (respuestas grabadas, nada se guarda)
//   VITE_BASE    carpeta desde la que se sirve la pagina (por defecto "/")
const esDemo = process.env.VITE_DEMO === '1';
const entradaDemo = {
  name: 'entrada-demo',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace('/src/main.jsx', '/src/main.demo.jsx') },
};

// El plugin de Tailwind se encarga de generar el CSS automaticamente.
// El proxy redirige las peticiones "/api/..." del frontend hacia el
// backend (puerto 4000), para no tener problemas de CORS en desarrollo.
// "/uploads/..." (fotos de mascotas) tambien viene del backend -- asi las
// fotos son del mismo origen y el editor de fotos puede dibujarlas en
// un <canvas> sin que el navegador lo bloquee.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss(), ...(esDemo ? [entradaDemo] : [])],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
