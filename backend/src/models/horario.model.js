// models/horario.model.js
// RF-13: horario de atencion configurable por sede. Si una sede no
// tiene fila para un dia de la semana, ese dia esta cerrada.
const { pool } = require('../config/db');
const { esFestivoColombiano } = require('../utils/festivosColombia');

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

// El festivo nacional queda cerrado por defecto. Solo una excepción abierta
// guardada por el administrador reemplaza el cierre; en los demás días se
// conserva el horario semanal habitual.
async function buscarHorarioParaFecha(sedeId, fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const fechaISO = `${anio}-${mes}-${dia}`;
  if (esFestivoColombiano(fechaISO)) {
    const resultado = await pool.query(
      `SELECT hora_inicio, hora_fin FROM horario_excepcion_sede
       WHERE sede_id = $1 AND fecha = $2::date`,
      [sedeId, fechaISO]
    );
    return resultado.rows[0] || null;
  }
  return buscarDia(sedeId, fecha.getDay());
}

async function listarExcepcionesFestivos(sedeId, anio) {
  const resultado = await pool.query(
    `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha,
            to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
            to_char(hora_fin, 'HH24:MI') AS hora_fin
     FROM horario_excepcion_sede
     WHERE sede_id = $1 AND fecha >= make_date($2, 1, 1)
       AND fecha < make_date($2 + 1, 1, 1)`,
    [sedeId, anio]
  );
  return resultado.rows;
}

async function abrirFestivo(sedeId, fecha, horaInicio, horaFin, usuarioId) {
  const resultado = await pool.query(
    `INSERT INTO horario_excepcion_sede (sede_id, fecha, hora_inicio, hora_fin, actualizado_por)
     VALUES ($1, $2::date, $3, $4, $5)
     ON CONFLICT (sede_id, fecha)
     DO UPDATE SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
                   actualizado_por = EXCLUDED.actualizado_por, actualizado_en = NOW()
     RETURNING to_char(fecha, 'YYYY-MM-DD') AS fecha,
               to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
               to_char(hora_fin, 'HH24:MI') AS hora_fin`,
    [sedeId, fecha, horaInicio, horaFin, usuarioId]
  );
  return resultado.rows[0];
}

async function cerrarFestivo(sedeId, fecha) {
  await pool.query('DELETE FROM horario_excepcion_sede WHERE sede_id = $1 AND fecha = $2::date', [sedeId, fecha]);
}

async function listarCitasFueraDeHorarioEnFecha(sedeId, fecha, horaInicio = null, horaFin = null) {
  const resultado = await pool.query(
    `${SELECT_AFECTADA}
     WHERE c.sede_id = $1 AND c.estado = 'agendada' AND c.fecha_hora > NOW()
       AND c.fecha_hora::date = $2::date
       AND ($3::time IS NULL OR c.fecha_hora::time < $3::time OR ${FIN_DE_LA_CITA}::time > $4::time
            OR ${FIN_DE_LA_CITA}::date > c.fecha_hora::date)
     ORDER BY c.fecha_hora`,
    [sedeId, fecha, horaInicio, horaFin]
  );
  return resultado.rows;
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

// Datos de una cita afectada por un cambio de agenda: los que necesita la
// ventana de confirmacion de la sede y el proceso que las reasigna o las
// deja por reagendar. Tambien los usa disponibilidadMedico.model.
const SELECT_AFECTADA = `
  SELECT c.id, c.codigo, c.fecha_hora, c.duracion_minutos, c.sede_id, c.servicio_id, c.medico_id,
         mc.nombre AS mascota_nombre, cl.nombre_completo AS cliente_nombre, sv.nombre AS servicio_nombre,
         m.nombre_completo AS medico_nombre
  FROM cita c
  JOIN mascota mc ON mc.id = c.mascota_id
  JOIN usuario cl ON cl.id = c.cliente_id
  JOIN servicio sv ON sv.id = c.servicio_id
  JOIN usuario m ON m.id = c.medico_id`;
const FIN_DE_LA_CITA = "(c.fecha_hora + GREATEST(c.duracion_minutos, 30) * INTERVAL '1 minute')";

// Citas agendadas y por atender de esa sede en ese dia de la semana que
// quedarian FUERA del horario [horaInicio, horaFin), contando lo que dura
// cada una. Sin horas: todas las de ese dia (se va a cerrar).
async function listarCitasFueraDeHorario(sedeId, diaSemana, horaInicio = null, horaFin = null) {
  const resultado = await pool.query(
    `${SELECT_AFECTADA}
     WHERE c.sede_id = $1 AND c.estado = 'agendada' AND c.fecha_hora > NOW()
       AND EXTRACT(DOW FROM c.fecha_hora) = $2
       AND ($3::time IS NULL OR c.fecha_hora::time < $3::time OR ${FIN_DE_LA_CITA}::time > $4::time
            OR ${FIN_DE_LA_CITA}::date > c.fecha_hora::date)
     ORDER BY c.fecha_hora`,
    [sedeId, diaSemana, horaInicio, horaFin]
  );
  return resultado.rows;
}

module.exports = {
  listarPorSede,
  buscarDia,
  buscarHorarioParaFecha,
  listarExcepcionesFestivos,
  abrirFestivo,
  cerrarFestivo,
  listarCitasFueraDeHorarioEnFecha,
  upsertDia,
  cerrarDia,
  listarCitasFueraDeHorario,
  SELECT_AFECTADA,
  FIN_DE_LA_CITA,
};
