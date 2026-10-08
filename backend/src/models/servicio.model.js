// models/servicio.model.js
// RF-11: catalogo de servicios veterinarios ofrecidos.
const { pool } = require('../config/db');

const SELECT_BASE = `
  SELECT s.id, s.nombre, s.descripcion, s.precio, s.duracion_minutos, s.activo,
         s.foto_url, s.foto_descripcion, s.foto_foco_x, s.foto_foco_y, s.foto_fondo_claro,
         c.id AS categoria_id, c.nombre AS categoria_nombre, c.color AS categoria_color
  FROM servicio s
  JOIN categoria_servicio c ON c.id = s.categoria_id
`;

async function listarTodos() {
  const resultado = await pool.query(`${SELECT_BASE} WHERE s.activo = true ORDER BY s.nombre`);
  return resultado.rows;
}

// Para el panel administrativo: incluye tambien los inactivos.
async function listarTodosAdmin() {
  const resultado = await pool.query(`${SELECT_BASE} ORDER BY s.nombre`);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`${SELECT_BASE} WHERE s.id = $1`, [id]);
  return resultado.rows[0] || null;
}

async function crear({ nombre, descripcion, categoriaId, precio, duracionMinutos }) {
  const resultado = await pool.query(
    `INSERT INTO servicio (nombre, descripcion, categoria_id, precio, duracion_minutos)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [nombre, descripcion || null, categoriaId, precio ?? 0, duracionMinutos ?? 30]
  );
  return buscarPorId(resultado.rows[0].id);
}

async function actualizar(
  id,
  { nombre, descripcion, categoriaId, precio, duracionMinutos, activo, fotoDescripcion, fotoFocoX, fotoFocoY }
) {
  const resultado = await pool.query(
    `UPDATE servicio SET
       nombre = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       categoria_id = COALESCE($4, categoria_id),
       precio = COALESCE($5, precio),
       activo = COALESCE($6, activo),
       duracion_minutos = COALESCE($7, duracion_minutos),
       foto_descripcion = COALESCE($8, foto_descripcion),
       foto_foco_x = COALESCE($9, foto_foco_x),
       foto_foco_y = COALESCE($10, foto_foco_y)
     WHERE id = $1
     RETURNING id`,
    [
      id,
      nombre ?? null,
      descripcion ?? null,
      categoriaId ?? null,
      precio ?? null,
      activo ?? null,
      duracionMinutos ?? null,
      fotoDescripcion ?? null,
      fotoFocoX ?? null,
      fotoFocoY ?? null,
    ]
  );
  if (resultado.rowCount === 0) return null;
  return buscarPorId(id);
}

// Foto del servicio (la del slider del inicio). Cambiarla reinicia el
// encuadre al centro; quitarla (fotoUrl null) tambien limpia lo demas.
// Devuelve la ruta anterior (para borrar su archivo), o undefined si el
// servicio no existe.
async function actualizarFoto(id, { fotoUrl, fondoClaro = true }) {
  const resultado = await pool.query(
    `UPDATE servicio s
     SET foto_url = $2::varchar,
         foto_fondo_claro = $3,
         foto_foco_x = 50,
         foto_foco_y = 50,
         foto_descripcion = CASE WHEN $2::varchar IS NULL THEN NULL ELSE s.foto_descripcion END
     FROM (SELECT id, foto_url AS anterior FROM servicio WHERE id = $1) previo
     WHERE s.id = previo.id
     RETURNING previo.anterior`,
    [id, fotoUrl, fondoClaro]
  );
  return resultado.rowCount === 0 ? undefined : resultado.rows[0].anterior;
}

module.exports = { listarTodos, listarTodosAdmin, buscarPorId, crear, actualizar, actualizarFoto };
