// models/medico.model.js
// "Medico" aqui es un usuario con rol 'veterinario'. RF-10/RF-11: el
// administrador ve los medicos de su sede y administra que servicio
// presta cada uno (servicio_medico).
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

// Todos los veterinarios de una sede, con la lista de servicios que
// presta cada uno. Para el panel administrativo (RF-10/RF-11).
async function listarConServicios(sedeId) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo, u.correo, u.sede_id, u.activo,
            COALESCE(
              json_agg(json_build_object('id', sv.id, 'nombre', sv.nombre)) FILTER (WHERE sv.id IS NOT NULL),
              '[]'
            ) AS servicios
     FROM usuario u
     LEFT JOIN servicio_medico sm ON sm.medico_id = u.id
     LEFT JOIN servicio sv ON sv.id = sm.servicio_id
     WHERE u.rol = 'veterinario' AND u.sede_id = $1
     GROUP BY u.id
     ORDER BY u.nombre_completo`,
    [sedeId]
  );
  return resultado.rows;
}

// Reemplaza por completo el conjunto de servicios que presta un medico.
// Transaccional: o se aplican todos los cambios, o ninguno.
async function reemplazarServicios(medicoId, servicioIds) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('DELETE FROM servicio_medico WHERE medico_id = $1', [medicoId]);
    for (const servicioId of servicioIds) {
      await cliente.query('INSERT INTO servicio_medico (medico_id, servicio_id) VALUES ($1, $2)', [
        medicoId,
        servicioId,
      ]);
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = {
  listarPorSedeYServicio,
  listarFranjasOcupadas,
  ofreceServicio,
  asignarServicio,
  listarConServicios,
  reemplazarServicios,
};
