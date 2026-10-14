// models/cita.model.js
const { pool } = require('../config/db');

// Dos citas se cruzan si una empieza antes de que la otra termine. Cada cita
// guarda la duracion con la que se agendo (minimo una franja de 30 minutos),
// asi cambiar despues la duracion del servicio no altera las ya agendadas.
// exceptoCitaId: al reprogramar, la propia cita no cuenta.
const CRUCE_CON_OTRA_CITA = `
  FROM cita c
  WHERE c.estado = 'agendada'
    AND c.fecha_hora < $2::timestamp + GREATEST($3::int, 30) * INTERVAL '1 minute'
    AND c.fecha_hora + GREATEST(c.duracion_minutos, 30) * INTERVAL '1 minute' > $2::timestamp
    AND ($4::uuid IS NULL OR c.id <> $4::uuid)`;

// Candados de la transaccion: uno por medico y otro por mascota, siempre en
// ese orden. Dos operaciones simultaneas sobre la misma agenda o la misma
// mascota esperan su turno y validan los cruces con los datos ya confirmados.
async function bloquearAgenda(cliente, medicoId, mascotaId) {
  await cliente.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`medico:${medicoId}`]);
  await cliente.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`mascota:${mascotaId}`]);
}

// Comprueba los cruces del medico y de la mascota dentro de la transaccion.
// 23505 es el codigo del indice unico (medico, hora): quien llama lo trata igual.
async function comprobarCruces(cliente, { medicoId, mascotaId, fechaHora, duracionMinutos, exceptoCitaId = null }) {
  const delMedico = await cliente.query(`SELECT 1 ${CRUCE_CON_OTRA_CITA} AND c.medico_id = $1 LIMIT 1`, [medicoId, fechaHora, duracionMinutos, exceptoCitaId]);
  if (delMedico.rowCount > 0) {
    throw Object.assign(new Error('El médico ya tiene una cita en ese horario.'), { code: '23505' });
  }
  const deLaMascota = await cliente.query(`SELECT 1 ${CRUCE_CON_OTRA_CITA} AND c.mascota_id = $1 LIMIT 1`, [mascotaId, fechaHora, duracionMinutos, exceptoCitaId]);
  if (deLaMascota.rowCount > 0) {
    throw Object.assign(new Error('Esa mascota ya tiene una cita a esa hora.'), { code: 'MASCOTA_OCUPADA' });
  }
}

async function existeConflicto(medicoId, fechaHora, duracionMinutos = 30, exceptoCitaId = null) {
  const resultado = await pool.query(`SELECT 1 ${CRUCE_CON_OTRA_CITA} AND c.medico_id = $1 LIMIT 1`, [medicoId, fechaHora, duracionMinutos, exceptoCitaId]);
  return resultado.rowCount > 0;
}

// La misma mascota no puede estar en dos citas a la vez.
async function mascotaOcupada(mascotaId, fechaHora, duracionMinutos = 30, exceptoCitaId = null) {
  const resultado = await pool.query(`SELECT 1 ${CRUCE_CON_OTRA_CITA} AND c.mascota_id = $1 LIMIT 1`, [mascotaId, fechaHora, duracionMinutos, exceptoCitaId]);
  return resultado.rowCount > 0;
}

// Citas agendadas que aun no ocurren de un cliente (tope al agendar).
async function contarFuturasDeCliente(clienteId) {
  const resultado = await pool.query("SELECT COUNT(*)::int AS total FROM cita WHERE cliente_id = $1 AND estado = 'agendada' AND fecha_hora > NOW()", [clienteId]);
  return resultado.rows[0].total;
}

// Crea la cita y le asigna su codigo visible CV-{sede}-{año}-{00000}
// (consecutivo por sede y por año). El upsert sobre consecutivo_cita es
// atomico (bloquea la fila de esa sede/año hasta el COMMIT), asi dos
// citas simultaneas nunca reciben el mismo numero. Si el INSERT de la
// cita falla (ej. 23505, el medico se ocupo en ese instante), el
// ROLLBACK deshace tambien el incremento: no quedan huecos.
// duracionMinutos: la del servicio al agendar; queda guardada en la cita.
// Dentro de la transaccion se toman los candados del medico y de la mascota
// y se vuelven a comprobar los cruces: el indice unico solo cubre dos citas
// del mismo medico a la MISMA hora.
async function crear({ clienteId, sedeId, sedeCodigo, servicioId, medicoId, fechaHora, mascotaId, motivo, duracionMinutos = 30 }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await bloquearAgenda(cliente, medicoId, mascotaId);
    await comprobarCruces(cliente, { medicoId, mascotaId, fechaHora, duracionMinutos });
    const anio = new Date().getFullYear();
    const consecutivo = await cliente.query(
      `INSERT INTO consecutivo_cita (sede_id, anio, ultimo) VALUES ($1, $2, 1)
       ON CONFLICT (sede_id, anio) DO UPDATE SET ultimo = consecutivo_cita.ultimo + 1
       RETURNING ultimo`,
      [sedeId, anio]
    );
    const codigo = formatearCodigoCita(sedeCodigo, anio, consecutivo.rows[0].ultimo);

    const resultado = await cliente.query(
      `INSERT INTO cita (cliente_id, sede_id, servicio_id, medico_id, fecha_hora, mascota_id, motivo, codigo, duracion_minutos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [clienteId, sedeId, servicioId, medicoId, fechaHora, mascotaId, motivo || null, codigo, Math.max(30, Number(duracionMinutos) || 30)]
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
         sv.nombre AS servicio_nombre, sv.descripcion AS servicio_descripcion, sv.precio AS servicio_precio,
         sv.duracion_minutos AS servicio_duracion_minutos,
         m.nombre_completo AS medico_nombre,
         (SELECT string_agg(cs.nombre, ', ' ORDER BY cs.nombre)
          FROM usuario_especialidad ue
          JOIN categoria_servicio cs ON cs.id = ue.categoria_id
          WHERE ue.usuario_id = c.medico_id) AS medico_especialidad,
         mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza,
         mc.sexo AS mascota_sexo, mc.peso_kg AS mascota_peso_kg, mc.color AS mascota_color,
         mc.fecha_nacimiento AS mascota_fecha_nacimiento, mc.foto_url AS mascota_foto_url,
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

// Citas de un cliente en una sola sede: lo que puede ver el administrador de esa sede.
async function listarPorClienteEnSede(clienteId, sedeId) {
  const resultado = await pool.query(`${SELECT_DETALLE} WHERE c.cliente_id = $1 AND c.sede_id = $2 ORDER BY c.fecha_hora DESC`, [clienteId, sedeId]);
  return resultado.rows;
}

// RF-12: seguimiento de citas por parte de administrativo/veterinario.
// Incluye la categoria del servicio (color) para el calendario del
// panel administrativo y los datos de la mascota y del dueño que muestra
// el detalle de la cita. La informacion medica de la mascota no va aqui:
// esa la ve solo el medico (listarPorMedico).
async function listarPorSede(sedeId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre, sv.duracion_minutos AS servicio_duracion_minutos,
            cat.nombre AS categoria_nombre, cat.color AS categoria_color,
            s.nombre AS sede_nombre,
            m.nombre_completo AS medico_nombre,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono, cl.correo AS cliente_correo,
            mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza,
            mc.foto_url AS mascota_foto_url, mc.sexo AS mascota_sexo, mc.peso_kg AS mascota_peso_kg,
            mc.fecha_nacimiento AS mascota_fecha_nacimiento
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
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

// Panel del medico: ademas de lo del calendario, el perfil completo de
// la mascota (foto, sexo, peso, edad e informacion medica que escribe
// el dueño) y el contacto del dueño, para el detalle de la cita.
async function listarPorMedico(medicoId) {
  const resultado = await pool.query(
    `SELECT c.*, sv.nombre AS servicio_nombre, sv.descripcion AS servicio_descripcion,
            sv.duracion_minutos AS servicio_duracion_minutos,
            cat.nombre AS categoria_nombre, cat.color AS categoria_color,
            s.nombre AS sede_nombre,
            cl.nombre_completo AS cliente_nombre, cl.telefono AS cliente_telefono, cl.correo AS cliente_correo,
            mc.nombre AS mascota_nombre, mc.especie AS mascota_especie, mc.raza AS mascota_raza,
            mc.foto_url AS mascota_foto_url, mc.sexo AS mascota_sexo, mc.peso_kg AS mascota_peso_kg,
            mc.fecha_nacimiento AS mascota_fecha_nacimiento, mc.alergias AS mascota_alergias,
            mc.medicamentos AS mascota_medicamentos, mc.condiciones_medicas AS mascota_condiciones_medicas,
            mc.observaciones AS mascota_observaciones
     FROM cita c
     JOIN sede s ON s.id = c.sede_id
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

// Valida y mueve la cita en una sola transaccion, con los mismos candados
// que al agendar: dos reprogramaciones simultaneas no pueden dejar citas
// cruzadas. Devuelve null si la cita ya no esta agendada.
async function reprogramar(id, nuevaFechaHora) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const actual = await cliente.query("SELECT medico_id, mascota_id, duracion_minutos FROM cita WHERE id = $1 AND estado = 'agendada' FOR UPDATE", [id]);
    if (actual.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return null;
    }
    const { medico_id: medicoId, mascota_id: mascotaId, duracion_minutos: duracionMinutos } = actual.rows[0];
    await bloquearAgenda(cliente, medicoId, mascotaId);
    await comprobarCruces(cliente, { medicoId, mascotaId, fechaHora: nuevaFechaHora, duracionMinutos, exceptoCitaId: id });
    const resultado = await cliente.query(
      // recordatorio_enviado_en vuelve a NULL: la fecha nueva lleva su propio recordatorio.
      `UPDATE cita SET fecha_hora = $2, actualizado_en = NOW(), recordatorio_enviado_en = NULL
       WHERE id = $1 AND estado = 'agendada'
       RETURNING *`,
      [id, nuevaFechaHora]
    );
    await cliente.query('COMMIT');
    return resultado.rows[0] || null;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
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
  mascotaOcupada,
  contarFuturasDeCliente,
  crear,
  formatearCodigoCita,
  buscarDetallePorId,
  listarPorCliente,
  listarPorClienteEnSede,
  listarPorSede,
  listarPorMedico,
  buscarPorId,
  reprogramar,
  cancelar,
};
