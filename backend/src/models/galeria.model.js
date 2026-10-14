// models/galeria.model.js
// Fotos de la galeria del inicio (Hero del landing).
const { pool } = require('../config/db');

const CAMPOS = 'id, foto_url, descripcion, foco_x, foco_y, orden, activo';

// Publico: solo las visibles, en el orden que definio el administrador.
async function listarVisibles() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM foto_galeria WHERE activo = true ORDER BY orden, creado_en`);
  return resultado.rows;
}

async function listarTodas() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM foto_galeria ORDER BY orden, creado_en`);
  return resultado.rows;
}

async function contar() {
  const resultado = await pool.query('SELECT COUNT(*)::int AS total FROM foto_galeria');
  return resultado.rows[0].total;
}

// La foto nueva queda al final de la galeria.
async function crear({ fotoUrl, descripcion, focoX = 50, focoY = 50 }) {
  const resultado = await pool.query(
    `INSERT INTO foto_galeria (foto_url, descripcion, foco_x, foco_y, orden)
     VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(orden), 0) + 1 FROM foto_galeria))
     RETURNING ${CAMPOS}`,
    [fotoUrl, descripcion, focoX, focoY]
  );
  return resultado.rows[0];
}

async function actualizar(id, { descripcion, focoX, focoY, activo }) {
  const resultado = await pool.query(
    `UPDATE foto_galeria
     SET descripcion = COALESCE($2, descripcion),
         foco_x = COALESCE($3, foco_x),
         foco_y = COALESCE($4, foco_y),
         activo = COALESCE($5, activo)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, descripcion ?? null, focoX ?? null, focoY ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

// Reordena la galeria: `ids` trae las fotos en su nuevo orden.
async function reordenar(ids) {
  await pool.query(
    `UPDATE foto_galeria f
     SET orden = nuevo.posicion
     FROM unnest($1::uuid[]) WITH ORDINALITY AS nuevo(id, posicion)
     WHERE f.id = nuevo.id`,
    [ids]
  );
}

// Devuelve la fila eliminada (para borrar su archivo), o null.
async function eliminar(id) {
  const resultado = await pool.query(`DELETE FROM foto_galeria WHERE id = $1 RETURNING ${CAMPOS}`, [id]);
  return resultado.rows[0] || null;
}

module.exports = { listarVisibles, listarTodas, contar, crear, actualizar, reordenar, eliminar };
