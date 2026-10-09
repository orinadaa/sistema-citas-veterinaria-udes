// models/notificacion.model.js
// Avisos de la campana. Cada fila pertenece a un destinatario: las consultas
// y los cambios siempre filtran por usuario_id, asi nadie ve ni marca las de
// otra persona.
const { pool } = require('../config/db');

async function crear({ usuarioId, tipo, titulo, mensaje, enlace = null }) {
  await pool.query('INSERT INTO notificacion (usuario_id, tipo, titulo, mensaje, enlace) VALUES ($1, $2, $3, $4, $5)', [
    usuarioId,
    tipo,
    titulo.slice(0, 120),
    mensaje.slice(0, 400),
    enlace,
  ]);
}

async function listarDeUsuario(usuarioId, limite = 30) {
  const [filas, sinLeer] = await Promise.all([
    pool.query(
      'SELECT id, tipo, titulo, mensaje, enlace, leida, creado_en FROM notificacion WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT $2',
      [usuarioId, limite]
    ),
    pool.query('SELECT COUNT(*)::int AS n FROM notificacion WHERE usuario_id = $1 AND NOT leida', [usuarioId]),
  ]);
  return { notificaciones: filas.rows, sinLeer: sinLeer.rows[0].n };
}

async function marcarLeida(usuarioId, id) {
  const resultado = await pool.query('UPDATE notificacion SET leida = true WHERE id = $2 AND usuario_id = $1', [usuarioId, id]);
  return resultado.rowCount > 0;
}

async function marcarTodasLeidas(usuarioId) {
  await pool.query('UPDATE notificacion SET leida = true WHERE usuario_id = $1 AND NOT leida', [usuarioId]);
}

// --- datos para armar los avisos ---------------------------------------
async function detalleCita(citaId) {
  const resultado = await pool.query(
    `SELECT c.id, c.codigo, c.fecha_hora, c.cliente_id, c.medico_id, c.sede_id,
            s.nombre AS sede_nombre, sv.nombre AS servicio_nombre, mc.nombre AS mascota_nombre,
            cl.nombre_completo AS cliente_nombre, cl.correo AS cliente_correo, m.nombre_completo AS medico_nombre
     FROM cita c
     JOIN sede s ON s.id = c.sede_id JOIN servicio sv ON sv.id = c.servicio_id
     JOIN mascota mc ON mc.id = c.mascota_id JOIN usuario cl ON cl.id = c.cliente_id JOIN usuario m ON m.id = c.medico_id
     WHERE c.id = $1`,
    [citaId]
  );
  return resultado.rows[0] || null;
}

// Recordatorio previo (RF-18): toma las citas activas que empiezan dentro
// de `horas` y aun no lo tienen, y las marca en la MISMA consulta: asi dos
// ejecuciones a la vez nunca avisan dos veces de la misma cita.
async function tomarCitasParaRecordar(horas) {
  const resultado = await pool.query(
    `UPDATE cita SET recordatorio_enviado_en = NOW()
     WHERE estado = 'agendada' AND recordatorio_enviado_en IS NULL
       AND fecha_hora > NOW() AND fecha_hora <= NOW() + ($1 || ' hours')::interval
     RETURNING id`,
    [horas]
  );
  return resultado.rows.map((fila) => fila.id);
}

module.exports = { crear, listarDeUsuario, marcarLeida, marcarTodasLeidas, detalleCita, tomarCitasParaRecordar };
