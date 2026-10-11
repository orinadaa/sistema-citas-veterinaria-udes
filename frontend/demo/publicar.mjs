// frontend/demo/publicar.mjs
// Compila la demostracion sin servidor y la deja lista en frontend/dist-demo
// para GitHub Pages. Antes hay que grabar los datos: node demo/grabar.mjs
// uso: node demo/publicar.mjs nombre-del-repositorio     (desde frontend/)
//      node demo/publicar.mjs nombre-del-repositorio --servir   (ademas la sirve en http://localhost:4173 para probarla)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..');
// Se pasa solo el nombre del repositorio (sin barras: Git Bash las convierte en rutas de Windows).
const repo = (process.argv[2] || '').replace(/^\/+|\/+$/g, '');
if (!/^[\w.-]*$/.test(repo)) throw new Error('Nombre de repositorio no válido: ' + repo);
const base = repo ? `/${repo}/` : '/';
const salida = path.join(raiz, 'dist-demo');

execSync('npx vite build --outDir dist-demo --emptyOutDir', { cwd: raiz, stdio: 'inherit', env: { ...process.env, VITE_DEMO: '1', VITE_BASE: base } });
// Fotos subidas que mencionan los datos grabados.
if (fs.existsSync(path.join(aqui, 'uploads'))) fs.cpSync(path.join(aqui, 'uploads'), path.join(salida, 'uploads'), { recursive: true });
// GitHub Pages devuelve 404.html en las rutas que no son archivos: asi abren los enlaces directos (/panel, /admin...).
fs.copyFileSync(path.join(salida, 'index.html'), path.join(salida, '404.html'));
fs.writeFileSync(path.join(salida, '.nojekyll'), '');
console.log('Demostración lista en', salida);

if (process.argv.includes('--servir')) {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json' };
  http
    .createServer((req, res) => {
      const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let archivo = ruta.startsWith(base) ? path.join(salida, ruta.slice(base.length)) : null;
      if (archivo && fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
      const existe = archivo && archivo.startsWith(salida) && fs.existsSync(archivo);
      // Igual que GitHub Pages: lo que no es un archivo responde 404 con 404.html.
      res.writeHead(existe ? 200 : 404, { 'Content-Type': tipos[existe ? path.extname(archivo) : '.html'] || 'application/octet-stream' });
      res.end(fs.readFileSync(existe ? archivo : path.join(salida, '404.html')));
    })
    .listen(4173, () => console.log('Sirviendo en http://localhost:4173' + base));
}
