// models/catalogo.model.js
// Catalogos que el superadministrador gestiona sin programar.
const { pool } = require('../config/db');

// ------------------------------------------------------------ categorias
// Con cuantos servicios y medicos se usa cada una (para que quien la
// desactive sepa a que afecta).
async function listarCategorias() {
  const resultado = await pool.query(
    `SELECT c.id, c.nombre, c.color, c.activo,
            (SELECT COUNT(*)::int FROM servicio s WHERE s.categoria_id = c.id) AS servicios,
            (SELECT COUNT(*)::int FROM usuario_especialidad ue WHERE ue.categoria_id = c.id) AS medicos
     FROM categoria_servicio c ORDER BY c.nombre`
  );
  return resultado.rows;
}

async function crearCategoria({ nombre, color }) {
  const resultado = await pool.query(
    'INSERT INTO categoria_servicio (nombre, color) VALUES ($1, $2) RETURNING id, nombre, color, activo',
    [nombre, color]
  );
  return resultado.rows[0];
}

async function actualizarCategoria(id, { nombre, color, activo }) {
  const resultado = await pool.query(
    `UPDATE categoria_servicio
     SET nombre = COALESCE($2::varchar, nombre), color = COALESCE($3::varchar, color), activo = COALESCE($4::boolean, activo)
     WHERE id = $1 RETURNING id, nombre, color, activo`,
    [id, nombre ?? null, color ?? null, activo ?? null]
  );
  return resultado.rows[0] || null;
}

// ------------------------------------------------------------ especies y razas
// soloActivas: lo que ven los formularios de mascota. Sin ella, todo (la
// pantalla de Catalogos), con cuantas mascotas usan cada especie y raza.
async function listarEspecies({ soloActivas = false } = {}) {
  const [especies, razas] = await Promise.all([
    pool.query(
      `SELECT e.id, e.nombre, e.icono, e.orden, e.activo,
              (SELECT COUNT(*)::int FROM mascota m WHERE m.especie = e.nombre) AS mascotas
       FROM especie e ${soloActivas ? 'WHERE e.activo' : ''} ORDER BY e.orden, e.nombre`
    ),
    pool.query(
      `SELECT r.id, r.especie_id, r.nombre, r.activo,
              (SELECT COUNT(*)::int FROM mascota m JOIN especie e ON e.id = r.especie_id
               WHERE m.especie = e.nombre AND m.raza = r.nombre) AS mascotas
       FROM raza r ${soloActivas ? 'WHERE r.activo' : ''} ORDER BY r.orden, r.nombre`
    ),
  ]);
  return especies.rows.map((especie) => ({ ...especie, razas: razas.rows.filter((r) => r.especie_id === especie.id) }));
}

async function buscarEspecie(id) {
  const resultado = await pool.query('SELECT id, nombre, icono, orden, activo FROM especie WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}

async function buscarRaza(id) {
  const resultado = await pool.query(
    'SELECT r.id, r.especie_id, r.nombre, r.activo, e.nombre AS especie_nombre FROM raza r JOIN especie e ON e.id = r.especie_id WHERE r.id = $1',
    [id]
  );
  return resultado.rows[0] || null;
}

async function crearEspecie({ nombre, icono }) {
  const resultado = await pool.query(
    `INSERT INTO especie (nombre, icono, orden)
     VALUES ($1, $2, (SELECT COALESCE(MAX(orden), -1) + 1 FROM especie))
     RETURNING id, nombre, icono, orden, activo`,
    [nombre, icono]
  );
  return resultado.rows[0];
}

// Renombrar es corregir el nombre, no crear otra especie: las mascotas que
// la tienen guardada (como texto) pasan al nombre nuevo en la misma
// transaccion, para que no queden con una especie que ya no existe.
async function actualizarEspecie(especie, { nombre, icono, activo }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await cliente.query(
      `UPDATE especie
       SET nombre = COALESCE($2::varchar, nombre), icono = COALESCE($3::varchar, icono), activo = COALESCE($4::boolean, activo)
       WHERE id = $1 RETURNING id, nombre, icono, orden, activo`,
      [especie.id, nombre ?? null, icono ?? null, activo ?? null]
    );
    if (nombre && nombre !== especie.nombre) {
      await cliente.query('UPDATE mascota SET especie = $2 WHERE especie = $1', [especie.nombre, nombre]);
    }
    await cliente.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function crearRaza(especieId, nombre) {
  const resultado = await pool.query(
    'INSERT INTO raza (especie_id, nombre) VALUES ($1, $2) RETURNING id, especie_id, nombre, activo',
    [especieId, nombre]
  );
  return resultado.rows[0];
}

// Igual que con la especie: renombrar corrige el texto en las mascotas que
// ya tienen esa raza (de esa especie).
async function actualizarRaza(raza, { nombre, activo }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await cliente.query(
      `UPDATE raza SET nombre = COALESCE($2::varchar, nombre), activo = COALESCE($3::boolean, activo)
       WHERE id = $1 RETURNING id, especie_id, nombre, activo`,
      [raza.id, nombre ?? null, activo ?? null]
    );
    if (nombre && nombre !== raza.nombre) {
      await cliente.query('UPDATE mascota SET raza = $3 WHERE especie = $1 AND raza = $2', [raza.especie_nombre, raza.nombre, nombre]);
    }
    await cliente.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  listarEspecies,
  buscarEspecie,
  buscarRaza,
  crearEspecie,
  actualizarEspecie,
  crearRaza,
  actualizarRaza,
};
