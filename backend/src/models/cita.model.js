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

// Crea la cita y le asigna su codigo visible CV-{sede}-{año}-{00000}
// (consecutivo por sede y por año, decision registrada en
// docs/incremento_4_pruebas.md). El upsert sobre consecutivo_cita es
// atomico (bloquea la fila de esa sede/año hasta el COMMIT), asi dos
// citas simultaneas nunca reciben el mismo numero. Si el INSERT de la
// cita falla (ej. 23505, el medico se ocupo en ese instante), el
// ROLLBACK deshace tambien el incremento: no quedan huecos.
async function crear({ clienteId, sedeId, sedeCodigo, servicioId, medicoId, fechaHora, mascotaId, motivo }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const anio = new Date().getFullYear();
    const consecutivo = await cliente.query(
      `INSERT INTO consecutivo_cita (sede_id, anio, ultimo) VALUES ($1, $2, 1)
       ON CONFLICT (sede_id, anio) DO UPDATE SET ultimo = consecutivo_cita.ultimo + 1
       RETURNING ultimo`,
      [sedeId, anio]
    );
    const codigo = formatearCodigoCita(sedeCodigo, anio, consecutivo.rows[0].ultimo);

    const resultado = await cliente.query(
      `INSERT INTO cita (cliente_id, sede_id, servicio_id, medico_id, fecha_hora, mascota_id, motivo, codigo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [clienteId, sedeId, servicioId, medicoId, fechaHora, mascotaId, motivo || null, codigo]
    );
    await cliente.query('COMMIT');
    return resultado.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

function formatearCodigoCita(sedeCodigo, anio, numero) {
  return `CV-${sedeCodigo}-${anio}-${String(numero).padStart(5, '0')}`;
}

// Columnas de detalle compartidas por "mis citas" y la pantalla de
// confirmacion del flujo de agendamiento.
const SELECT_DETALLE = `
  SELECT c.*, s.nombre AS sede_nombre, s.ciudad AS sede_ciudad, s.direccion AS sede_direccion, s.foto_url AS sede_foto_url,
         sv.nombre AS servicio_nombre, sv.precio AS servicio_precio, sv.duracion_minutos AS servicio_duracion_minutos,
         m.nombre_completo AS medico_nombre,
         (SELECT string_agg(cs.nombre, ', ' ORDER BY cs.nombre)
          FROM usuario_especialidad ue
          JOIN categoria_servicio cs ON cs.id = ue.categoria_id
          WHERE ue.usuario_id = c.medico_id) AS medico_especialidad,
         mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza,
         mc.sexo AS mascota_sexo, mc.peso_kg AS mascota_peso_kg, mc.color AS mascota_color,
         mc.fecha_nacimiento AS mascota_fecha_nacimiento,
         cl.nombre_completo AS cliente_nombre, cl.correo AS cliente_correo
  FROM cita c
  JOIN sede s ON s.id = c.sede_id
  JOIN servicio sv ON sv.id = c.servicio_id
  JOIN usuario m ON m.id = c.medico_id
  JOIN usuario cl ON cl.id = c.cliente_id
  JOIN mascota mc ON mc.id = c.mascota_id
`;

async function buscarDetallePorId(id) {
  const resultado = await pool.query(`${SELECT_DETALLE} WHERE c.id = $1`, [id]);
  return resultado.rows[0] || null;
}

// Incluye datos de detalle (direccion/foto de sede, precio del
// servicio, especialidad del medico, perfil de la mascota) para la
// pantalla "Detalle de la cita" del panel del cliente. Subconsulta
// escalar para la especialidad (en vez de LEFT JOIN + GROUP BY): un
// medico puede tener varias, y asi se evita tener que agregar cada
// columna de sede/servicio/mascota al GROUP BY solo por eso.
async function listarPorCliente(clienteId) {
  const resultado = await pool.query(`${SELECT_DETALLE} WHERE c.cliente_id = $1 ORDER BY c.fecha_hora DESC`, [clienteId]);
  return resultado.rows;
}

// RF-12: seguimiento de citas por parte de administrativo/veterinario.
// Incluye la categoria del servicio (color) para el calendario del
// panel administrativo y los datos de la mascota.
async function listarPorSede(sedeId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre, cat.nombre AS categoria_nombre, cat.color AS categoria_color,
            m.nombre_completo AS medico_nombre,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono,
            mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza
     FROM cita c
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN categoria_servicio cat ON cat.id = sv.categoria_id
     JOIN usuario m ON m.id = c.medico_id
     JOIN usuario cl ON cl.id = c.cliente_id
     JOIN mascota mc ON mc.id = c.mascota_id
     WHERE c.sede_id = $1
     ORDER BY c.fecha_hora`,
    [sedeId]
  );
  return resultado.rows;
}

async function listarPorMedico(medicoId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre, cat.nombre AS categoria_nombre, cat.color AS categoria_color,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono,
            mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza
     FROM cita c
     JOIN servicio sv ON sv.id = c.servicio_id
     JOIN categoria_servicio cat ON cat.id = sv.categoria_id
     JOIN usuario cl ON cl.id = c.cliente_id
     JOIN mascota mc ON mc.id = c.mascota_id
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
  formatearCodigoCita,
  buscarDetallePorId,
  listarPorCliente,
  listarPorSede,
  listarPorMedico,
  buscarPorId,
  reprogramar,
  cancelar,
};
