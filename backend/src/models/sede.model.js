// models/sede.model.js
const { pool } = require('../config/db');

const CAMPOS = 'id, nombre, ciudad, direccion, foto_url, activo, es_principal, codigo, tiene_parqueadero, sala_pet_friendly';

// Publico (landing, flujo de agendamiento): solo sedes activas, no
// tiene sentido ofrecer agendar en una sede que el admin desactivo.
// servicios_ofrecidos: cuantos servicios distintos prestan los medicos
// activos de la sede (amenidad "Especialidades" de la tarjeta de sede),
// calculado de los datos reales en vez de escrito a mano.
async function listarTodas() {
  const resultado = await pool.query(
    `SELECT ${CAMPOS.split(', ').map((c) => `s.${c}`).join(', ')},
            (SELECT COUNT(DISTINCT sm.servicio_id)::int
             FROM servicio_medico sm
             JOIN usuario u ON u.id = sm.medico_id
             JOIN servicio sv ON sv.id = sm.servicio_id
             WHERE u.sede_id = s.id AND u.rol = 'veterinario' AND u.activo = true AND sv.activo = true) AS servicios_ofrecidos
     FROM sede s
     WHERE s.activo = true
     ORDER BY s.es_principal DESC, s.ciudad`
  );
  return resultado.rows;
}

// Para el panel administrativo: incluye tambien las inactivas, para
// poder reactivarlas.
async function listarTodasAdmin() {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM sede ORDER BY es_principal DESC, ciudad`);
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(`SELECT ${CAMPOS} FROM sede WHERE id = $1`, [id]);
  return resultado.rows[0] || null;
}

// Solo puede haber una sede principal (indice unico parcial en la BD):
// marcar una como principal desmarca las demas en la misma transaccion.
async function ejecutarConPrincipal(esPrincipal, consulta) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    if (esPrincipal === true) {
      await cliente.query('UPDATE sede SET es_principal = false WHERE es_principal');
    }
    const resultado = await consulta(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function crear({ nombre, ciudad, direccion, fotoUrl, codigo, esPrincipal, tieneParqueadero, salaPetFriendly }) {
  return ejecutarConPrincipal(esPrincipal, async (cliente) => {
    const resultado = await cliente.query(
      `INSERT INTO sede (nombre, ciudad, direccion, foto_url, codigo, es_principal, tiene_parqueadero, sala_pet_friendly)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${CAMPOS}`,
      [nombre, ciudad, direccion || null, fotoUrl || null, codigo, Boolean(esPrincipal), Boolean(tieneParqueadero), Boolean(salaPetFriendly)]
    );
    return resultado.rows[0];
  });
}

async function actualizar(id, { nombre, ciudad, direccion, fotoUrl, activo, codigo, esPrincipal, tieneParqueadero, salaPetFriendly }) {
  return ejecutarConPrincipal(esPrincipal, async (cliente) => {
    const resultado = await cliente.query(
      `UPDATE sede SET
         nombre = COALESCE($2, nombre),
         ciudad = COALESCE($3, ciudad),
         direccion = COALESCE($4, direccion),
         foto_url = COALESCE($5, foto_url),
         activo = COALESCE($6, activo),
         codigo = COALESCE($7, codigo),
         es_principal = COALESCE($8, es_principal),
         tiene_parqueadero = COALESCE($9, tiene_parqueadero),
         sala_pet_friendly = COALESCE($10, sala_pet_friendly)
       WHERE id = $1
       RETURNING ${CAMPOS}`,
      [
        id,
        nombre ?? null,
        ciudad ?? null,
        direccion ?? null,
        fotoUrl ?? null,
        activo ?? null,
        codigo ?? null,
        esPrincipal ?? null,
        tieneParqueadero ?? null,
        salaPetFriendly ?? null,
      ]
    );
    return resultado.rows[0] || null;
  });
}

module.exports = { listarTodas, listarTodasAdmin, buscarPorId, crear, actualizar };
