// models/disponibilidadMedico.model.js
// Horario propio por medico y sede, y sus bloqueos. La regla esta en
// utils/disponibilidadMedico.js.
const { pool } = require('../config/db');
const { fechaLocalISO } = require('../utils/disponibilidadMedico');

const HORA = (columna) => `to_char(${columna}, 'HH24:MI') AS ${columna.split('.').pop()}`;

// Todo lo necesario para decidir, con medicoAtiende(), si esos medicos
// atienden en franjas de `fecha` en `sedeId`.
async function cargarContexto(medicoIds, sedeId, fecha) {
  if (medicoIds.length === 0) {
    return { sedeId, conHorarioPropio: new Set(), horarioDelDia: new Map(), bloqueos: [] };
  }
  const [conHorario, delDia, bloqueos] = await Promise.all([
    pool.query('SELECT DISTINCT medico_id FROM horario_medico WHERE medico_id = ANY($1::uuid[])', [medicoIds]),
    pool.query(
      `SELECT medico_id, sede_id, ${HORA('hora_inicio')}, ${HORA('hora_fin')}, ${HORA('pausa_inicio')}, ${HORA('pausa_fin')}
       FROM horario_medico WHERE medico_id = ANY($1::uuid[]) AND dia_semana = $2`,
      [medicoIds, fecha.getDay()]
    ),
    pool.query(
      `SELECT medico_id, to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio, to_char(fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
              ${HORA('hora_inicio')}, ${HORA('hora_fin')}
       FROM bloqueo_medico WHERE medico_id = ANY($1::uuid[]) AND $2::date BETWEEN fecha_inicio AND fecha_fin`,
      [medicoIds, fechaLocalISO(fecha)]
    ),
  ]);
  return {
    sedeId,
    conHorarioPropio: new Set(conHorario.rows.map((f) => f.medico_id)),
    horarioDelDia: new Map(delDia.rows.map((f) => [f.medico_id, f])),
    bloqueos: bloqueos.rows,
  };
}

// true si el medico atiende en esa sede: con horario propio, si tiene
// algun dia ahi; sin horario propio, si es su sede (usuario.sede_id).
async function atiendeEnSede(medicoId, sedeId) {
  const resultado = await pool.query(
    `SELECT CASE
       WHEN EXISTS (SELECT 1 FROM horario_medico WHERE medico_id = $1)
         THEN EXISTS (SELECT 1 FROM horario_medico WHERE medico_id = $1 AND sede_id = $2)
       ELSE EXISTS (SELECT 1 FROM usuario WHERE id = $1 AND sede_id = $2)
     END AS atiende`,
    [medicoId, sedeId]
  );
  return resultado.rows[0].atiende;
}

// --- Configuracion desde "Mi perfil > Disponibilidad" ---------------

async function listarHorario(medicoId) {
  const resultado = await pool.query(
    `SELECT h.dia_semana, h.sede_id, s.nombre AS sede_nombre, ${HORA('h.hora_inicio')}, ${HORA('h.hora_fin')},
            ${HORA('h.pausa_inicio')}, ${HORA('h.pausa_fin')}
     FROM horario_medico h JOIN sede s ON s.id = h.sede_id
     WHERE h.medico_id = $1 ORDER BY h.dia_semana`,
    [medicoId]
  );
  return resultado.rows;
}

// Reemplaza el horario semanal completo (lista vacia = volver al
// horario de la sede).
async function reemplazarHorario(medicoId, dias) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('DELETE FROM horario_medico WHERE medico_id = $1', [medicoId]);
    for (const d of dias) {
      await cliente.query(
        `INSERT INTO horario_medico (medico_id, sede_id, dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [medicoId, d.sedeId, d.diaSemana, d.horaInicio, d.horaFin, d.pausaInicio || null, d.pausaFin || null]
      );
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Bloqueos vigentes (que terminan hoy o despues).
async function listarBloqueos(medicoId) {
  const resultado = await pool.query(
    `SELECT id, to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio, to_char(fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
            ${HORA('hora_inicio')}, ${HORA('hora_fin')}, motivo
     FROM bloqueo_medico WHERE medico_id = $1 AND fecha_fin >= CURRENT_DATE
     ORDER BY fecha_inicio, hora_inicio NULLS FIRST`,
    [medicoId]
  );
  return resultado.rows;
}

async function crearBloqueo(medicoId, { fechaInicio, fechaFin, horaInicio, horaFin, motivo }) {
  const resultado = await pool.query(
    `INSERT INTO bloqueo_medico (medico_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, motivo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [medicoId, fechaInicio, fechaFin, horaInicio || null, horaFin || null, motivo || null]
  );
  return resultado.rows[0];
}

async function eliminarBloqueo(medicoId, bloqueoId) {
  const resultado = await pool.query('DELETE FROM bloqueo_medico WHERE id = $1 AND medico_id = $2', [bloqueoId, medicoId]);
  return resultado.rowCount > 0;
}

// Citas activas futuras del medico que caen dentro de un bloqueo (entre
// las dos fechas y, si el bloqueo tiene horas, cruzandose con esas horas).
async function listarCitasEnBloqueo(medicoId, { fechaInicio, fechaFin, horaInicio = null, horaFin = null }) {
  const { SELECT_AFECTADA, FIN_DE_LA_CITA } = require('./horario.model');
  const resultado = await pool.query(
    `${SELECT_AFECTADA}
     WHERE c.medico_id = $1 AND c.estado = 'agendada' AND c.fecha_hora > NOW()
       AND c.fecha_hora::date BETWEEN $2::date AND $3::date
       AND ($4::time IS NULL OR (c.fecha_hora::time < $5::time AND ${FIN_DE_LA_CITA}::time > $4::time))
     ORDER BY c.fecha_hora`,
    [medicoId, fechaInicio, fechaFin, horaInicio, horaFin]
  );
  return resultado.rows;
}

// Todas las citas activas futuras del medico (al cambiar su horario se
// revisa cuales quedaron fuera).
async function listarCitasFuturas(medicoId) {
  const { SELECT_AFECTADA } = require('./horario.model');
  const resultado = await pool.query(
    `${SELECT_AFECTADA} WHERE c.medico_id = $1 AND c.estado = 'agendada' AND c.fecha_hora > NOW() ORDER BY c.fecha_hora`,
    [medicoId]
  );
  return resultado.rows;
}

module.exports = {
  cargarContexto,
  atiendeEnSede,
  listarHorario,
  reemplazarHorario,
  listarBloqueos,
  crearBloqueo,
  eliminarBloqueo,
  listarCitasEnBloqueo,
  listarCitasFuturas,
};
