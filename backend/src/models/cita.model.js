// models/cita.model.js
const { pool } = require('../config/db');

// True si ese medico ya tiene una cita activa exactamente en esa fecha_hora.
// Ademas de esta validacion en la API, el indice unico parcial de la BD
// (medico_id, fecha_hora) actua como respaldo ante condiciones de carrera.
async function existeConflicto(medicoId, fechaHora) {
  const resultado = await pool.query(
    `SELECT 1 FROM cita WHERE medico_id = $1 AND fecha_hora = $2 AND estado = 'agendada' LIMIT 1`,
    [medicoId, fechaHora]
  );
  return resultado.rowCount > 0;
}

async function crear({ clienteId, sedeId, servicioId, medicoId, fechaHora, nombreMascota, motivo }) {
  const resultado = await pool.query(
    `INSERT INTO cita (cliente_id, sede_id, servicio_id, medico_id, fecha_hora, nombre_mascota, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [clienteId, sedeId, servicioId, medicoId, fechaHora, nombreMascota, motivo || null]
  );
  return resultado.rows[0];
}

async function listarPorCliente(clienteId) {
  const resultado = await pool.query(
    `SELECT c.*, s.nombre AS sede_nombre, s.ciudad AS sede_ciudad,
            sv.nombre AS servicio_nombre, m.nombre_completo AS medico_nombre
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN usuario m ON m.id = c.medico_id
     WHERE c.cliente_id = $1
     ORDER BY c.fecha_hora DESC`,
    [clienteId]
  );
  return resultado.rows;
}

// RF-12: seguimiento de citas por parte de administrativo/veterinario.
async function listarPorSede(sedeId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre, m.nombre_completo AS medico_nombre,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono
     FROM cita c
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN usuario m ON m.id = c.medico_id
     JOIN usuario cl ON cl.id = c.cliente_id
     WHERE c.sede_id = $1
     ORDER BY c.fecha_hora`,
    [sedeId]
  );
  return resultado.rows;
}

async function listarPorMedico(medicoId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono
     FROM cita c
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN usuario cl ON cl.id = c.cliente_id
     WHERE c.medico_id = $1
     ORDER BY c.fecha_hora`,
    [medicoId]
  );
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query('SELECT * FROM cita WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}

async function reprogramar(id, nuevaFechaHora) {
  const resultado = await pool.query(
    `UPDATE cita SET fecha_hora = $2, actualizado_en = NOW()
     WHERE id = $1 AND estado = 'agendada'
     RETURNING *`,
    [id, nuevaFechaHora]
  );
  return resultado.rows[0] || null;
}

async function cancelar(id) {
  const resultado = await pool.query(
    `UPDATE cita SET estado = 'cancelada', actualizado_en = NOW()
     WHERE id = $1 AND estado = 'agendada'
     RETURNING *`,
    [id]
  );
  return resultado.rows[0] || null;
}

module.exports = {
  existeConflicto,
  crear,
  listarPorCliente,
  listarPorSede,
  listarPorMedico,
  buscarPorId,
  reprogramar,
  cancelar,
};
