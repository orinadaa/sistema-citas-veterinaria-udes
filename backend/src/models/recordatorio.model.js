// models/recordatorio.model.js
// Recordatorios que el medico crea para una mascota de sus pacientes.
const { pool } = require('../config/db');

const TIPOS = ['medicacion', 'control', 'vacunacion', 'desparasitacion', 'otro'];

async function crear({ tipo, titulo, descripcion, fecha, hora, mascotaId, clienteId, medicoId }) {
  const resultado = await pool.query(
    `INSERT INTO recordatorio (tipo, titulo, descripcion, fecha, hora, mascota_id, cliente_id, medico_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, tipo, titulo, descripcion, to_char(fecha, 'YYYY-MM-DD') AS fecha, to_char(hora, 'HH24:MI') AS hora,
               mascota_id, cliente_id, medico_id, creado_en`,
    [tipo, titulo, descripcion || null, fecha, hora, mascotaId, clienteId, medicoId]
  );
  return resultado.rows[0];
}

// Recordatorios de una mascota (de cualquier medico), del mas cercano
// al mas lejano; fecha/hora como texto para evitar corrimientos de zona.
async function listarPorMascota(mascotaId) {
  const resultado = await pool.query(
    `SELECT r.id, r.tipo, r.titulo, r.descripcion, to_char(r.fecha, 'YYYY-MM-DD') AS fecha, to_char(r.hora, 'HH24:MI') AS hora,
            r.creado_en, m.nombre_completo AS medico_nombre
     FROM recordatorio r
     JOIN usuario m ON m.id = r.medico_id
     WHERE r.mascota_id = $1
     ORDER BY r.fecha, r.hora`,
    [mascotaId]
  );
  return resultado.rows;
}

module.exports = { TIPOS, crear, listarPorMascota };
