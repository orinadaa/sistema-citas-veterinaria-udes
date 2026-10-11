// frontend/demo/grabar.mjs
// Graba las respuestas de lectura de la API que usa cada pantalla, para la
// demostracion sin servidor (GitHub Pages). Recorre la plataforma SOLO MIRANDO
// con las cuentas de ejemplo (@demo.udes.co): no guarda, cancela ni borra.
// Antes de escribir el archivo reemplaza los datos de las cuentas que NO son
// de ejemplo (nombre, correo, telefono, documento, foto) por datos ficticios.
// Requiere el frontend (5173) y el backend encendidos.
// uso: node demo/grabar.mjs      (desde frontend/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(aqui, '..', '..', 'backend');
const require = createRequire(backend + '/package.json');
require('dotenv').config({ path: backend + '/.env', quiet: true });
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });

const CUENTAS = ['maria.gomez@demo.udes.co', 'sofia.ramirez@demo.udes.co', 'jorge.castro@demo.udes.co'];
const sesiones = {};
for (const correo of CUENTAS) {
  const u = (await pool.query('select id, rol, sede_id, nombre_completo, correo from usuario where activo and correo = $1', [correo])).rows[0];
  if (!u) throw new Error('Falta la cuenta de ejemplo ' + correo + ' (npm run demo:cargar en backend)');
  const usuario = { id: u.id, rol: u.rol, nombreCompleto: u.nombre_completo, correo: u.correo, sedeId: u.sede_id };
  sesiones[correo] = { usuario, real: jwt.sign({ id: u.id, rol: u.rol, sedeId: u.sede_id }, process.env.JWT_SECRET, { expiresIn: '30m' }) };
}

const puerto = 9593;
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-demo-'));
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let lista;
for (let i = 0; i < 60 && !lista; i++) {
  await esperar(250);
  try {
    lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
  } catch {
    /* aun no abre */
  }
}
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pend = new Map();
const cdp = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pend.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

let rolActual = 'publico';
const respuestas = { publico: {}, cliente: {}, veterinario: {}, administrador: {} };
const peticiones = new Map();
const escrituras = [];
const pendientes = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  }
  if (m.method === 'Network.requestWillBeSent' && /\/api\//.test(m.params.request.url)) {
    const u = new URL(m.params.request.url);
    if (m.params.request.method === 'GET') peticiones.set(m.params.requestId, { clave: u.pathname + u.search, rol: rolActual });
    else if (m.params.request.method !== 'OPTIONS') escrituras.push(m.params.request.method + ' ' + u.pathname);
  }
  if (m.method === 'Network.loadingFinished' && peticiones.has(m.params.requestId)) {
    const p = peticiones.get(m.params.requestId);
    pendientes.push(
      cdp('Network.getResponseBody', { requestId: m.params.requestId }).then((r) => {
        try {
          respuestas[p.rol][p.clave] = JSON.parse(r.result.body);
        } catch {
          /* no era JSON */
        }
      })
    );
  }
});
const ev = async (e) => (await cdp('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const J = JSON.stringify;
const BASE = 'http://localhost:5173';
const ir = async (ruta, ms = 4000) => {
  await cdp('Page.navigate', { url: BASE + ruta });
  await esperar(ms);
};
const entrar = async (correo) => {
  await ir('/no-existe', 1200);
  if (!correo) {
    rolActual = 'publico';
    await ev(`localStorage.removeItem('udes_veterinaria_sesion')`);
    return;
  }
  const s = sesiones[correo];
  rolActual = s.usuario.rol;
  await ev(`localStorage.setItem('udes_veterinaria_sesion', ${J(J({ usuario: s.usuario, token: s.real }))})`);
};
// Clic por texto exacto, nombre accesible exacto o comienzo del texto (tarjetas).
const clic = async (texto, ms = 2500, empieza = false) => {
  const r = await ev(`(() => { const b = [...document.querySelectorAll('button, a, [role=tab]')].find((x) => { const t = x.textContent.trim(); return (${empieza} ? t.startsWith(${J(texto)}) : (t === ${J(texto)} || x.getAttribute('aria-label') === ${J(texto)})) && x.getBoundingClientRect().width > 0 && !x.closest('[inert]'); }); if (!b) return 'NO HAY ' + ${J(texto)}; b.click(); return 'ok'; })()`);
  if (r !== 'ok') console.log('  ', r);
  await esperar(ms);
};

await cdp('Runtime.enable');
await cdp('Network.enable');
await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const grabadoEn = new Date().toISOString();

await entrar(null);
for (const r of ['/', '/privacidad', '/aviso-legal', '/iniciar-sesion', '/registrarse']) await ir(r, r === '/' ? 6000 : 2500);

await entrar(CUENTAS[0]);
await ir('/panel', 5000);
for (const t of ['Mis mascotas', 'Mis citas']) await clic(t, 2000);
await ir('/panel/perfil');
await ir('/agendar', 4500);
await clic('Max', 600, true);
await clic('Vacunación', 800, true);
await clic('Continuar', 3500);
await clic('Clinica Veterinaria UDES Bucaramanga', 2500, true);
for (const dia of ['13', '14', '15', '16']) await clic(dia, 1800);

await entrar(CUENTAS[1]);
await ir('/medico', 5000);
for (const t of ['Mis pacientes', 'Mi horario', 'Mis citas']) await clic(t, 2500);
await ir('/medico/perfil');

await entrar(CUENTAS[2]);
await ir('/admin', 5000);
for (const t of ['Citas', 'Médicos', 'Pacientes', 'Servicios', 'Horario', 'Reportes', 'Inicio']) await clic(t, 3500);

await esperar(1500);
await Promise.all(pendientes);
await ev(`localStorage.removeItem('udes_veterinaria_sesion')`);
ws.close();
edge.kill();

// ---------- Datos de cuentas reales fuera ----------
let texto = JSON.stringify({ grabadoEn, sesiones: Object.fromEntries(CUENTAS.map((c) => [c, { usuario: sesiones[c].usuario, token: 'demo-' + sesiones[c].usuario.rol }])), respuestas });
const reales = (await pool.query("select * from usuario where correo not like '%@demo.udes.co'")).rows;
let n = 0;
const cambia = (valor, por) => {
  if (typeof valor !== 'string' || valor.trim().length < 5) return;
  texto = texto.split(J(valor).slice(1, -1)).join(por);
};
for (const u of reales) {
  n++;
  for (const [columna, valor] of Object.entries(u)) {
    if (/correo/.test(columna)) cambia(valor, `persona${n}@demo.udes.co`);
    else if (/nombre/.test(columna)) cambia(valor, u.rol === 'veterinario' ? `Profesional de ejemplo ${n}` : `Persona de ejemplo ${n}`);
    else if (/telefono|celular|whatsapp/.test(columna)) cambia(valor, '3000000000');
    else if (/documento|cedula|tarjeta/.test(columna)) cambia(valor, '0000000');
    else if (/biografia|descripcion|direccion/.test(columna)) cambia(valor, 'Texto de ejemplo.');
    else if (/foto/.test(columna)) cambia(valor, '');
  }
}
// Fotos de las mascotas de esas cuentas.
for (const m of (await pool.query("select foto_url from mascota where foto_url is not null and cliente_id in (select id from usuario where correo not like '%@demo.udes.co')")).rows) cambia(m.foto_url, '');
await pool.end();

const correosAjenos = [...new Set(texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [])].filter((c) => !c.endsWith('@demo.udes.co'));
fs.mkdirSync(path.join(aqui, '..', 'src', 'demo'), { recursive: true });
fs.writeFileSync(path.join(aqui, '..', 'src', 'demo', 'datos.json'), texto);

// Archivos subidos que mencionan los datos: se copian junto a la pagina.
const destino = path.join(aqui, 'uploads');
fs.rmSync(destino, { recursive: true, force: true });
let copiados = 0;
for (const ruta of new Set(texto.match(/\/uploads\/[\w\-./]+/g) || [])) {
  const origen = path.join(backend, ruta);
  if (!fs.existsSync(origen)) continue;
  fs.mkdirSync(path.dirname(path.join(aqui, ruta)), { recursive: true });
  fs.copyFileSync(origen, path.join(aqui, ruta));
  copiados++;
}
for (const [rol, r] of Object.entries(respuestas)) console.log(rol, Object.keys(r).length, 'respuestas');
console.log('datos.json:', Math.round(texto.length / 1024), 'KB | archivos copiados:', copiados, '| cuentas reales sustituidas:', reales.length);
console.log('Correos que no son de ejemplo en los datos:', correosAjenos.length ? correosAjenos.join(', ') : 'ninguno');
console.log('Peticiones de escritura durante la grabación:', escrituras.length ? escrituras.join(' ; ') : 'ninguna');
