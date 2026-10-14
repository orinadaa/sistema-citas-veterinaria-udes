// models/reportes.model.js
// Agregaciones de solo lectura para el panel de Reportes.
const { pool } = require('../config/db');

async function obtenerKpis(sedeId) {
  const inicioMes = `date_trunc('month', NOW())`;
  const [citasMes, citasMesAnterior, servicios, medicos, pacientes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total FROM cita
       WHERE fecha_hora >= ${inicioMes} AND fecha_hora < ${inicioMes} + INTERVAL '1 month'
         AND ($1::uuid IS NULL OR sede_id = $1)`,
      [sedeId || null]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM cita
       WHERE fecha_hora >= ${inicioMes} - INTERVAL '1 month' AND fecha_hora < ${inicioMes}
         AND ($1::uuid IS NULL OR sede_id = $1)`,
      [sedeId || null]
    ),
    pool.query(`SELECT COUNT(*) AS total FROM servicio WHERE activo = true`),
    pool.query(
      `SELECT COUNT(*) AS total FROM usuario WHERE rol = 'veterinario' AND activo = true AND ($1::uuid IS NULL OR sede_id = $1)`,
      [sedeId || null]
    ),
    sedeId
      ? pool.query(
          `SELECT COUNT(DISTINCT cliente_id) AS total FROM cita WHERE sede_id = $1`,
          [sedeId]
        )
      : pool.query(`SELECT COUNT(*) AS total FROM usuario WHERE rol = 'cliente'`),
  ]);

  return {
    citasMes: Number(citasMes.rows[0].total),
    citasMesAnterior: Number(citasMesAnterior.rows[0].total),
    serviciosActivos: Number(servicios.rows[0].total),
    medicosActivos: Number(medicos.rows[0].total),
    pacientesRegistrados: Number(pacientes.rows[0].total),
  };
}

async function citasPorSemana(desde, hasta) {
  const resultado = await pool.query(
    `SELECT date_trunc('week', c.fecha_hora) AS semana, s.id AS sede_id, s.nombre AS sede_nombre, COUNT(*) AS total
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
     WHERE c.fecha_hora >= $1 AND c.fecha_hora < $2
     GROUP BY semana, s.id, s.nombre
     ORDER BY semana`,
    [desde, hasta]
  );
  return resultado.rows.map((fila) => ({ ...fila, total: Number(fila.total) }));
}

async function rankingServicios(sedeId, desde, hasta) {
  const resultado = await pool.query(
    `SELECT sv.nombre AS servicio, COUNT(*) AS total
     FROM cita c
     JOIN servicio sv ON sv.id = c.servicio_id
     WHERE c.fecha_hora >= $1 AND c.fecha_hora < $2 AND ($3::uuid IS NULL OR c.sede_id = $3)
     GROUP BY sv.nombre
     ORDER BY total DESC
     LIMIT 8`,
    [desde, hasta, sedeId || null]
  );
  return resultado.rows.map((fila) => ({ ...fila, total: Number(fila.total) }));
}

async function citasPorSede(desde, hasta) {
  const resultado = await pool.query(
    `SELECT s.nombre AS sede, COUNT(*) AS total
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
     WHERE c.fecha_hora >= $1 AND c.fecha_hora < $2
     GROUP BY s.nombre
     ORDER BY total DESC`,
    [desde, hasta]
  );
  return resultado.rows.map((fila) => ({ ...fila, total: Number(fila.total) }));
}

async function estadoCitas(sedeId, desde, hasta) {
  const resultado = await pool.query(
    `SELECT estado, COUNT(*) AS total FROM cita
     WHERE fecha_hora >= $1 AND fecha_hora < $2 AND ($3::uuid IS NULL OR sede_id = $3)
     GROUP BY estado`,
    [desde, hasta, sedeId || null]
  );
  return resultado.rows.map((fila) => ({ ...fila, total: Number(fila.total) }));
}

async function ultimasCitas(sedeId, desde, hasta) {
  const resultado = await pool.query(
    `SELECT c.id, c.fecha_hora, c.estado, s.nombre AS sede_nombre, sv.nombre AS servicio_nombre,
            m.nombre_completo AS medico_nombre, cl.nombre_completo AS cliente_nombre, mc.nombre AS mascota_nombre
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN usuario m ON m.id = c.medico_id
     JOIN usuario cl ON cl.id = c.cliente_id
     JOIN mascota mc ON mc.id = c.mascota_id
     WHERE c.fecha_hora >= $1 AND c.fecha_hora < $2 AND ($3::uuid IS NULL OR c.sede_id = $3)
     ORDER BY c.creado_en DESC
     LIMIT 10`,
    [desde, hasta, sedeId || null]
  );
  return resultado.rows;
}

module.exports = {
  obtenerKpis,
  citasPorSemana,
  rankingServicios,
  citasPorSede,
  estadoCitas,
  ultimasCitas,
};
