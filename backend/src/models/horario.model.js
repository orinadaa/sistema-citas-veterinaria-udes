// models/horario.model.js
// RF-13: horario de atencion configurable por sede. Si una sede no
// tiene fila para un dia de la semana, ese dia esta cerrada.
const { pool } = require('../config/db');

async function listarPorSede(sedeId) {
  const resultado = await pool.query(
    'SELECT dia_semana, hora_inicio, hora_fin FROM horario_atencion WHERE sede_id = $1 ORDER BY dia_semana',
    [sedeId]
  );
  return resultado.rows;
}

async function buscarDia(sedeId, diaSemana) {
  const resultado = await pool.query(
    'SELECT hora_inicio, hora_fin FROM horario_atencion WHERE sede_id = $1 AND dia_semana = $2',
    [sedeId, diaSemana]
  );
  return resultado.rows[0] || null;
}

async function upsertDia(sedeId, diaSemana, horaInicio, horaFin) {
  const resultado = await pool.query(
    `INSERT INTO horario_atencion (sede_id, dia_semana, hora_inicio, hora_fin)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (sede_id, dia_semana)
     DO UPDATE SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin
     RETURNING dia_semana, hora_inicio, hora_fin`,
    [sedeId, diaSemana, horaInicio, horaFin]
  );
  return resultado.rows[0];
}

async function cerrarDia(sedeId, diaSemana) {
  await pool.query('DELETE FROM horario_atencion WHERE sede_id = $1 AND dia_semana = $2', [sedeId, diaSemana]);
}

module.exports = { listarPorSede, buscarDia, upsertDia, cerrarDia };
