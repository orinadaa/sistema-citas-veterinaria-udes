// models/cuenta.model.js
// "Mi perfil" del cliente: sus datos personales y un resumen real de su
// cuenta. El cambio de correo y de contraseña usan los mismos modelos del
// resto del sistema (verificacion_correo y codigo_recuperacion).
const { pool } = require('../config/db');

const CAMPOS = 'id, nombre_completo, correo, telefono, documento, direccion, activo, creado_en';

async function obtener(usuarioId) {
  const [perfil, resumen] = await Promise.all([
    pool.query(`SELECT ${CAMPOS} FROM usuario WHERE id = $1`, [usuarioId]),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM mascota WHERE cliente_id = $1 AND activo) AS mascotas,
         (SELECT COUNT(*)::int FROM cita WHERE cliente_id = $1 AND estado = 'agendada' AND fecha_hora >= NOW()) AS citas_proximas,
         (SELECT COUNT(*)::int FROM cita WHERE cliente_id = $1 AND estado = 'agendada' AND fecha_hora < NOW()) AS citas_realizadas`,
      [usuarioId]
    ),
  ]);
  if (!perfil.rows[0]) return null;
  return { ...perfil.rows[0], resumen: resumen.rows[0] };
}

// Actualizacion parcial: solo los campos que llegan (undefined = no tocar;
// cadena vacia = borrar, para los opcionales).
async function actualizar(usuarioId, { nombreCompleto, telefono, documento, direccion }) {
  await pool.query(
    `UPDATE usuario SET
       nombre_completo = COALESCE($2::varchar, nombre_completo),
       telefono = CASE WHEN $3::boolean THEN NULLIF($4::varchar, '') ELSE telefono END,
       documento = CASE WHEN $5::boolean THEN NULLIF($6::varchar, '') ELSE documento END,
       direccion = CASE WHEN $7::boolean THEN NULLIF($8::varchar, '') ELSE direccion END
     WHERE id = $1`,
    [usuarioId, nombreCompleto ?? null, telefono !== undefined, telefono ?? '', documento !== undefined, documento ?? '', direccion !== undefined, direccion ?? '']
  );
  return obtener(usuarioId);
}

module.exports = { obtener, actualizar };
