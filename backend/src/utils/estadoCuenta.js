// utils/estadoCuenta.js
// Estado vigente de una cuenta, leido de la base en cada peticion con sesion
// (auth.middleware.js): si esta activa, su rol y sede de AHORA, y desde
// cuando valen sus sesiones.
// - Antes solo se revisaba "activo" y el rol salia del token: a quien se le
//   cambiaba el rol o la sede conservaba los permisos viejos hasta 8 horas.
// - sesiones_validas_desde: se actualiza al cambiar la contraseña; los tokens
//   emitidos antes dejan de servir (una sesion robada no sobrevive al cambio).
// La respuesta se recuerda 30 segundos para no consultar en cada peticion;
// los cambios hechos desde este mismo servidor la olvidan al instante.
const { pool } = require('../config/db');

const SEGUNDOS_CACHE = 30;
const cuentas = new Map(); // id -> { estado, vence }

async function estadoDeCuenta(id) {
  const ahora = Date.now();
  const recordado = cuentas.get(id);
  if (recordado && recordado.vence > ahora) return recordado.estado;
  const resultado = await pool.query(
    'SELECT activo, rol, sede_id, EXTRACT(EPOCH FROM sesiones_validas_desde) AS desde FROM usuario WHERE id::text = $1',
    [String(id)]
  );
  const fila = resultado.rows[0];
  const estado = fila
    ? { activo: Boolean(fila.activo), rol: fila.rol, sedeId: fila.sede_id || null, sesionesDesde: fila.desde ? Math.floor(Number(fila.desde)) : 0 }
    : null;
  if (cuentas.size > 5000) cuentas.clear();
  cuentas.set(id, { estado, vence: ahora + SEGUNDOS_CACHE * 1000 });
  return estado;
}

// Tras cambiar rol, sede, estado o contraseña de una cuenta.
function olvidarCuenta(id) {
  cuentas.delete(id);
}

module.exports = { estadoDeCuenta, olvidarCuenta };
