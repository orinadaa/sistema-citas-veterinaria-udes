// models/pacienteMedico.model.js
// "Mis pacientes" del medico veterinario: dueños (clientes) que tienen o
// tuvieron al menos una cita con ese medico, con sus mascotas.
const { pool } = require('../config/db');

// Una fila por mascota activa con alguna cita con este medico: dueño,
// mascota, ultima cita ya pasada, proxima cita futura (sin canceladas) y
// sedes donde la atendio. sedeId (opcional) filtra por la sede de las
// citas; busqueda (opcional) por nombre del dueño o de la mascota.
async function listarPorMedico(medicoId, { sedeId, busqueda } = {}) {
  const resultado = await pool.query(
    `SELECT cl.id AS cliente_id, cl.nombre_completo AS cliente_nombre, cl.correo AS cliente_correo,
            cl.telefono AS cliente_telefono, cl.activo AS cliente_activo,
            mc.id AS mascota_id, mc.nombre AS mascota_nombre, mc.especie AS mascota_especie,
            mc.raza AS mascota_raza, mc.foto_url AS mascota_foto_url,
            MAX(c.fecha_hora) FILTER (WHERE c.estado = 'agendada' AND c.fecha_hora <= NOW()) AS ultima_cita,
            MIN(c.fecha_hora) FILTER (WHERE c.estado = 'agendada' AND c.fecha_hora > NOW()) AS proxima_cita,
            COUNT(c.id)::int AS citas_total
     FROM cita c
     JOIN usuario cl ON cl.id = c.cliente_id
     JOIN mascota mc ON mc.id = c.mascota_id AND mc.activo
     WHERE c.medico_id = $1
       AND ($2::uuid IS NULL OR c.sede_id = $2)
       AND ($3::text IS NULL OR cl.nombre_completo ILIKE '%' || $3 || '%' OR mc.nombre ILIKE '%' || $3 || '%')
     GROUP BY cl.id, mc.id
     ORDER BY cl.nombre_completo, mc.nombre`,
    [medicoId, sedeId || null, busqueda || null]
  );
  return resultado.rows;
}

// Citas (no canceladas) por dueño con este medico: para el KPI de
// "pacientes frecuentes".
async function contarCitasPorCliente(medicoId) {
  const resultado = await pool.query(
    `SELECT cliente_id, COUNT(*)::int AS total
     FROM cita WHERE medico_id = $1 AND estado = 'agendada'
     GROUP BY cliente_id`,
    [medicoId]
  );
  return resultado.rows;
}

// true si ese dueño tiene o tuvo al menos una cita con este medico.
async function esPacienteDe(clienteId, medicoId) {
  const resultado = await pool.query('SELECT 1 FROM cita WHERE cliente_id = $1 AND medico_id = $2 LIMIT 1', [clienteId, medicoId]);
  return resultado.rowCount > 0;
}

module.exports = { listarPorMedico, contarCitasPorCliente, esPacienteDe };
