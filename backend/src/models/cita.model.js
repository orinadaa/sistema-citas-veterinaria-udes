// models/cita.model.js
const { pool } = require('../config/db');

// Franjas ya ocupadas (citas activas) de una sede dentro de un rango
// [inicio, fin). Se usa tanto para calcular disponibilidad (RF-07) como
// para validar que no se agende/reprograme sobre una franja tomada.
async function listarFranjasOcupadas(sedeId, inicio, fin) {
  const resultado = await pool.query(
    `SELECT fecha_hora FROM cita
     WHERE sede_id = $1 AND estado = 'agendada' AND fecha_hora >= $2 AND fecha_hora < $3`,
    [sedeId, inicio, fin]
  );
  return resultado.rows.map((fila) => fila.fecha_hora);
}

async function crear({ clienteId, sedeId, fechaHora, nombreMascota, motivo }) {
  const resultado = await pool.query(
    `INSERT INTO cita (cliente_id, sede_id, fecha_hora, nombre_mascota, motivo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clienteId, sedeId, fechaHora, nombreMascota, motivo || null]
  );
  return resultado.rows[0];
}

async function listarPorCliente(clienteId) {
  const resultado = await pool.query(
    `SELECT c.*, s.nombre AS sede_nombre, s.ciudad AS sede_ciudad
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
     WHERE c.cliente_id = $1
     ORDER BY c.fecha_hora DESC`,
    [clienteId]
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
  listarFranjasOcupadas,
  crear,
  listarPorCliente,
  buscarPorId,
  reprogramar,
  cancelar,
};
