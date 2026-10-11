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

// Citas agendadas y por atender de esa sede en ese dia de la semana que
// quedarian FUERA del horario [horaInicio, horaFin). Sin horas: todas las
// de ese dia (se va a cerrar). No se cancelan solas: se avisa.
async function contarCitasFueraDeHorario(sedeId, diaSemana, horaInicio = null, horaFin = null) {
  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total FROM cita
     WHERE sede_id = $1 AND estado = 'agendada' AND fecha_hora > NOW()
       AND EXTRACT(DOW FROM fecha_hora) = $2
       AND ($3::time IS NULL OR fecha_hora::time < $3::time OR fecha_hora::time >= $4::time)`,
    [sedeId, diaSemana, horaInicio, horaFin]
  );
  return resultado.rows[0].total;
}

module.exports = { listarPorSede, buscarDia, upsertDia, cerrarDia, contarCitasFueraDeHorario };
