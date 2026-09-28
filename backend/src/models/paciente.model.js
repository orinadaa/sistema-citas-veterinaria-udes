// models/paciente.model.js
// "Paciente" en el panel administrativo = un cliente (dueño) con el
// resumen de sus mascotas/citas. No es una tabla nueva: se agrega
// sobre usuario/mascota/cita ya existentes.
const { pool } = require('../config/db');

// sedeId es opcional (vista multisede, ver decisiones del incremento
// 3): si se indica, solo se cuentan las citas de esa sede y se excluye
// a los clientes que no tengan ninguna cita ahi.
async function listarClientes({ sedeId, busqueda }) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo, u.correo, u.telefono, u.activo, u.creado_en,
            COUNT(DISTINCT m.id) AS mascotas_total,
            COUNT(DISTINCT c.id) AS citas_total,
            MAX(c.fecha_hora) AS ultima_cita
     FROM usuario u
     LEFT JOIN mascota m ON m.cliente_id = u.id AND m.activo
     LEFT JOIN cita c ON c.cliente_id = u.id AND ($1::uuid IS NULL OR c.sede_id = $1)
     WHERE u.rol = 'cliente'
       AND ($2::text IS NULL OR u.nombre_completo ILIKE '%' || $2 || '%')
     GROUP BY u.id
     HAVING ($1::uuid IS NULL OR COUNT(DISTINCT c.id) > 0)
     ORDER BY u.nombre_completo`,
    [sedeId || null, busqueda || null]
  );
  return resultado.rows;
}

async function contarCitasDelMes(sedeId) {
  const resultado = await pool.query(
    `SELECT COUNT(*) AS total FROM cita
     WHERE fecha_hora >= date_trunc('month', NOW())
       AND fecha_hora < date_trunc('month', NOW()) + INTERVAL '1 month'
       AND ($1::uuid IS NULL OR sede_id = $1)`,
    [sedeId || null]
  );
  return Number(resultado.rows[0].total);
}

module.exports = { listarClientes, contarCitasDelMes };
