// demo/activar.js
// Demostracion sin servidor (GitHub Pages). Solo entra en la compilacion de
// demostracion (VITE_DEMO=1, ver vite.config.js y main.demo.jsx): la
// plataforma normal no carga este archivo.
import grabado from './datos.json';

const BASE = import.meta.env.BASE_URL;
// Las fotos subidas viven junto a la pagina, bajo la misma carpeta base.
const datos = JSON.parse(JSON.stringify(grabado).replaceAll('"/uploads/', `"${BASE}uploads/`));

// ---------- Reloj ----------
const FechaReal = Date;
const arranque = FechaReal.now();
const momento = new FechaReal(datos.grabadoEn).getTime();
const ahora = () => momento + (FechaReal.now() - arranque);
class FechaDemo extends FechaReal {
  constructor(...partes) {
    if (partes.length === 0) super(ahora());
    else super(...partes);
  }
  static now() {
    return ahora();
  }
}
window.Date = FechaDemo;

// ---------- API ----------
const responder = (cuerpo, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
const pedirDeVerdad = window.fetch.bind(window);

function buscar(rol, ruta, clave) {
  for (const grupo of [datos.respuestas[rol] || {}, datos.respuestas.publico]) {
    if (clave in grupo) return grupo[clave];
  }
  // La misma ruta con otros parametros (otra fecha, otro filtro).
  for (const grupo of [datos.respuestas[rol] || {}, datos.respuestas.publico]) {
    const parecida = Object.keys(grupo).find((k) => k.split('?')[0] === ruta);
    if (parecida) return grupo[parecida];
  }
  return undefined;
}

window.fetch = async (url, opciones = {}) => {
  const destino = new URL(String(url?.url ?? url), window.location.origin);
  const desde = destino.pathname.indexOf('/api/');
  if (desde < 0) return pedirDeVerdad(url, opciones);
  const ruta = destino.pathname.slice(desde);
  const metodo = (opciones.method || 'GET').toUpperCase();
  const autorizacion = opciones.headers?.Authorization || '';
  const rol = (autorizacion.match(/demo-(\w+)/) || [])[1] || 'publico';
  await new Promise((r) => setTimeout(r, 150));

  if (metodo === 'POST' && ruta === '/api/auth/login') {
    const correo = String(JSON.parse(opciones.body || '{}').correo || '').trim().toLowerCase();
    const sesion = datos.sesiones[correo];
    return sesion ? responder(sesion) : responder({ mensaje: 'En la demostración solo entran las cuentas de ejemplo que aparecen en el aviso.' }, 400);
  }
  if (metodo !== 'GET') {
    if (ruta.startsWith('/api/notificaciones')) return responder({});
    return responder({ mensaje: 'Esta es una demostración con datos de ejemplo: los cambios no se guardan.' }, 400);
  }
  const cuerpo = buscar(rol, ruta, ruta + destino.search);
  return cuerpo === undefined ? responder({ mensaje: 'Este dato no está disponible en la demostración.' }, 404) : responder(cuerpo);
};

// ---------- Aviso ----------
function avisar() {
  const caja = document.createElement('aside');
  caja.setAttribute('aria-label', 'Aviso de demostración');
  caja.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;max-width:330px;padding:12px 14px;border-radius:14px;background:#0b2a66;color:#fff;font:500 13px/1.45 Raleway,Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)';
  const cuentas = Object.values(datos.sesiones).map((s) => `<li><strong>${{ cliente: 'Cliente', veterinario: 'Médica', administrador: 'Administrador de sede' }[s.usuario.rol]}:</strong> ${s.usuario.correo}</li>`).join('');
  caja.innerHTML = `<strong style="font-size:14px">Demostración con datos de ejemplo</strong><p style="margin:6px 0">No hay servidor: los cambios no se guardan. Para entrar usa una de estas cuentas con cualquier contraseña:</p><ul style="margin:0 0 8px;padding-left:18px">${cuentas}</ul>`;
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.textContent = 'Ocultar';
  cerrar.style.cssText = 'padding:5px 12px;border-radius:999px;border:1px solid #fff;background:transparent;color:#fff;font:600 12px Raleway,Arial,sans-serif;cursor:pointer';
  cerrar.addEventListener('click', () => caja.remove());
  caja.append(cerrar);
  document.body.append(caja);
}
if (document.body) avisar();
else window.addEventListener('DOMContentLoaded', avisar);
