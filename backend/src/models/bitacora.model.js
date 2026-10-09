// models/bitacora.model.js
// Bitacora de cambios: solo se inserta y se consulta (nunca se edita ni se
// borra). El nombre de quien hizo el cambio se resuelve al consultar.
const { pool } = require('../config/db');

async function registrar({ usuarioId, usuarioRol, accion, entidad, entidadId, detalle }) {
  await pool.query(
    'INSERT INTO bitacora (usuario_id, usuario_rol, accion, entidad, entidad_id, detalle) VALUES ($1, $2, $3, $4, $5, $6)',
    [usuarioId, usuarioRol, accion, entidad, entidadId, detalle]
  );
}

async function listar({ busqueda, limite, desplazamiento }) {
  const filtro = busqueda
    ? `WHERE b.accion ILIKE $1 OR b.entidad ILIKE $1 OR b.detalle ILIKE $1 OR u.nombre_completo ILIKE $1`
    : '';
  const valores = busqueda ? [`%${busqueda}%`] : [];
  const desde = 'FROM bitacora b LEFT JOIN usuario u ON u.id = b.usuario_id';
  const [filas, total] = await Promise.all([
    pool.query(
      `SELECT b.id, b.creado_en, b.accion, b.entidad, b.entidad_id, b.detalle, b.usuario_rol,
              COALESCE(u.nombre_completo, 'Cuenta desconocida') AS usuario_nombre
       ${desde} ${filtro}
       ORDER BY b.creado_en DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, limite, desplazamiento]
    ),
    pool.query(`SELECT COUNT(*)::int AS total ${desde} ${filtro}`, valores),
  ]);
  return { filas: filas.rows, total: total.rows[0].total };
}

module.exports = { registrar, listar };
