// middlewares/seguridad.middleware.js
// Endurecimiento del servidor. Sin librerias nuevas: son pocas reglas y asi el
// stack del proyecto no cambia.

const ES_PRODUCCION = process.env.NODE_ENV === 'production';

function cabecerasSeguridad(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (ES_PRODUCCION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.path.startsWith('/api/')) {
    // La API solo devuelve datos: nada de lo que responde debe ejecutarse ni
    // quedar guardado en la cache de un equipo compartido.
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}

// CORS_ORIGENES (backend/.env): sitios separados por coma. Sin definir, solo
// el frontend local de desarrollo.
function origenesPermitidos() {
  const lista = (process.env.CORS_ORIGENES || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origen) => origen.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return {
    // Sin cabecera Origin no es una llamada de otro sitio desde un navegador
    // (misma pagina, proxy de Vite, pruebas, herramientas): no aplica CORS.
    origin: (origen, listo) => listo(null, !origen || lista.includes(origen)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
}

// En produccion, una peticion que llego por HTTP se redirige a HTTPS. Detras
// de un proxy (Nginx, la plataforma de hosting) hace falta TRUST_PROXY=1 para
// que Express sepa por donde llego de verdad.
function forzarHttps(req, res, next) {
  if (!ES_PRODUCCION || req.secure) return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(403).json({ mensaje: 'Esta operación requiere una conexión segura (HTTPS).' });
  }
  return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
}

// Tope por IP. En memoria: alcanza para un solo servidor (el alcance del
// proyecto); con varios habria que llevarlo a un almacen compartido.
// En las pruebas automaticas no cuenta, salvo las del propio limite.
// clave (opcional): de que depende el tope. Por defecto la IP; tambien
// puede ser la cuenta que se intenta abrir o el usuario con sesion.
function limitarIntentos({ ventanaMinutos, maximo, mensaje, clave: claveDe }) {
  const ventanaMs = ventanaMinutos * 60 * 1000;
  const intentos = new Map(); // ip -> { cuenta, vence }

  // Limpieza periodica para que el mapa no crezca sin fin.
  const limpieza = setInterval(() => {
    const ahora = Date.now();
    intentos.forEach((valor, clave) => valor.vence <= ahora && intentos.delete(clave));
  }, ventanaMs);
  limpieza.unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && !process.env.LIMITE_EN_PRUEBAS) return next();
    const ahora = Date.now();
    const clave = (claveDe && claveDe(req)) || req.ip || 'desconocida';
    let registro = intentos.get(clave);
    if (!registro || registro.vence <= ahora) {
      registro = { cuenta: 0, vence: ahora + ventanaMs };
      intentos.set(clave, registro);
    }
    registro.cuenta += 1;
    if (registro.cuenta > maximo) {
      res.setHeader('Retry-After', String(Math.ceil((registro.vence - ahora) / 1000)));
      return res.status(429).json({ mensaje: mensaje || 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    }
    return next();
  };
}

module.exports = { cabecerasSeguridad, origenesPermitidos, forzarHttps, limitarIntentos };
