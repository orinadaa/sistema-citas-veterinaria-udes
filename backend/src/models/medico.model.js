// models/medico.model.js
// "Medico" aqui es un usuario con rol 'veterinario'. La asignacion de
// que medico presta que servicio (servicio_medico) la administrara el
// panel administrativo en el incremento 3; mientras tanto se siembra
// con backend/src/scripts/seedVeterinarios.js.
const { pool } = require('../config/db');

async function listarPorSedeYServicio(sedeId, servicioId) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo
     FROM usuario u
     JOIN servicio_medico sm ON sm.medico_id = u.id
     WHERE u.rol = 'veterinario' AND u.sede_id = $1 AND sm.servicio_id = $2 AND u.activo = true
     ORDER BY u.nombre_completo`,
    [sedeId, servicioId]
  );
  return resultado.rows;
}

// Filas {medico_id, fecha_hora} de citas activas de esos medicos dentro
// de un rango [inicio, fin). Sirve para calcular disponibilidad agregada.
async function listarFranjasOcupadas(medicoIds, inicio, fin) {
  if (medicoIds.length === 0) return [];
  const resultado = await pool.query(
    `SELECT medico_id, fecha_hora FROM cita
     WHERE medico_id = ANY($1::uuid[]) AND estado = 'agendada' AND fecha_hora >= $2 AND fecha_hora < $3`,
    [medicoIds, inicio, fin]
  );
  return resultado.rows;
}

async function ofreceServicio(medicoId, servicioId) {
  const resultado = await pool.query(
    'SELECT 1 FROM servicio_medico WHERE medico_id = $1 AND servicio_id = $2',
    [medicoId, servicioId]
  );
  return resultado.rowCount > 0;
}

async function asignarServicio(medicoId, servicioId) {
  await pool.query(
    'INSERT INTO servicio_medico (medico_id, servicio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [medicoId, servicioId]
  );
}

module.exports = { listarPorSedeYServicio, listarFranjasOcupadas, ofreceServicio, asignarServicio };
