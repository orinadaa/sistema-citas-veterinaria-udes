// models/datos.model.js
// Modulo "Datos" del superadministrador.
const { pool } = require('../config/db');

const SI_NO = [
  { valor: 'true', etiqueta: 'Sí' },
  { valor: 'false', etiqueta: 'No' },
];

const DIA = `(ARRAY['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'])[h.dia_semana + 1]`;

// columnas: { clave, etiqueta, sql, tipo?, opciones? (se puede filtrar), soloDetalle? }
// interna: no se muestra como columna; con enFilas viaja ademas en cada fila del listado.
// tipo: texto (por defecto) | fecha | fechaHora | booleano | numero | dinero
const ENTIDADES = {
  usuarios: {
    etiqueta: 'Usuarios',
    singular: 'usuario',
    desde: 'FROM usuario u LEFT JOIN sede s ON s.id = u.sede_id',
    id: 'u.id',
    orden: 'u.creado_en DESC',
    buscar: ['u.nombre_completo', 'u.correo', 'u.telefono', 'u.documento'],
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre', sql: 'u.nombre_completo' },
      { clave: 'correo', etiqueta: 'Correo', sql: 'u.correo' },
      {
        clave: 'rol',
        etiqueta: 'Rol',
        sql: 'u.rol',
        opciones: [
          { valor: 'superadministrador', etiqueta: 'Superadministrador' },
          { valor: 'administrador', etiqueta: 'Administrador de sede' },
          { valor: 'veterinario', etiqueta: 'Médico' },
          { valor: 'cliente', etiqueta: 'Cliente' },
        ],
      },
      { clave: 'sede', etiqueta: 'Sede', sql: 's.nombre' },
      { clave: 'telefono', etiqueta: 'Teléfono', sql: 'u.telefono' },
      { clave: 'activo', etiqueta: 'Activa', sql: 'u.activo', tipo: 'booleano', opciones: SI_NO },
      { clave: 'creado', etiqueta: 'Registrado', sql: 'u.creado_en', tipo: 'fecha' },
      { clave: 'documento', etiqueta: 'Documento', sql: 'u.documento', soloDetalle: true },
      { clave: 'direccion', etiqueta: 'Dirección', sql: 'u.direccion', soloDetalle: true },
    ],
  },
  mascotas: {
    etiqueta: 'Mascotas',
    singular: 'mascota',
    desde: 'FROM mascota m JOIN usuario c ON c.id = m.cliente_id',
    id: 'm.id',
    orden: 'm.creado_en DESC',
    buscar: ['m.nombre', 'm.especie', 'm.raza', 'c.nombre_completo'],
    relaciones: { cliente_id: 'm.cliente_id' },
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre', sql: 'm.nombre' },
      { clave: 'especie', etiqueta: 'Especie', sql: 'm.especie' },
      { clave: 'raza', etiqueta: 'Raza', sql: 'm.raza' },
      { clave: 'dueno', etiqueta: 'Dueño', sql: 'c.nombre_completo' },
      { clave: 'activo', etiqueta: 'Activa', sql: 'm.activo', tipo: 'booleano', opciones: SI_NO },
      { clave: 'creado', etiqueta: 'Registrada', sql: 'm.creado_en', tipo: 'fecha' },
      { clave: 'sexo', etiqueta: 'Sexo', sql: 'm.sexo', soloDetalle: true },
      { clave: 'nacimiento', etiqueta: 'Nacimiento', sql: 'm.fecha_nacimiento', tipo: 'fecha', soloDetalle: true },
      { clave: 'peso', etiqueta: 'Peso (kg)', sql: 'm.peso_kg', tipo: 'numero', soloDetalle: true },
      { clave: 'color', etiqueta: 'Color', sql: 'm.color', soloDetalle: true },
      { clave: 'dueno_correo', etiqueta: 'Correo del dueño', sql: 'c.correo', soloDetalle: true },
      { clave: 'cliente_id', etiqueta: 'cliente_id', sql: 'm.cliente_id', interna: true },
      // La foto no es una columna de la tabla ni del CSV: viaja con cada fila
      // para dibujar el avatar de la mascota.
      { clave: 'foto_url', etiqueta: 'foto_url', sql: 'm.foto_url', interna: true, enFilas: true },
    ],
  },
  citas: {
    etiqueta: 'Citas',
    singular: 'cita',
    desde: `FROM cita ci
            JOIN usuario c ON c.id = ci.cliente_id
            JOIN usuario md ON md.id = ci.medico_id
            JOIN mascota m ON m.id = ci.mascota_id
            JOIN servicio sv ON sv.id = ci.servicio_id
            JOIN sede s ON s.id = ci.sede_id`,
    id: 'ci.id',
    orden: 'ci.fecha_hora DESC',
    buscar: ['ci.codigo', 'c.nombre_completo', 'm.nombre', 'md.nombre_completo', 'sv.nombre'],
    relaciones: { cliente_id: 'ci.cliente_id', mascota_id: 'ci.mascota_id', medico_id: 'ci.medico_id' },
    columnas: [
      { clave: 'codigo', etiqueta: 'Código', sql: 'ci.codigo' },
      { clave: 'fecha', etiqueta: 'Fecha y hora', sql: 'ci.fecha_hora', tipo: 'fechaHora' },
      { clave: 'cliente', etiqueta: 'Cliente', sql: 'c.nombre_completo' },
      { clave: 'mascota', etiqueta: 'Mascota', sql: 'm.nombre' },
      { clave: 'servicio', etiqueta: 'Servicio', sql: 'sv.nombre' },
      { clave: 'medico', etiqueta: 'Médico', sql: 'md.nombre_completo' },
      { clave: 'sede', etiqueta: 'Sede', sql: 's.nombre' },
      {
        clave: 'estado',
        etiqueta: 'Estado',
        sql: 'ci.estado',
        opciones: [
          { valor: 'agendada', etiqueta: 'Agendada' },
          { valor: 'cancelada', etiqueta: 'Cancelada' },
        ],
      },
      { clave: 'duracion', etiqueta: 'Duración (min)', sql: 'ci.duracion_minutos', tipo: 'numero', soloDetalle: true },
      { clave: 'motivo', etiqueta: 'Motivo', sql: 'ci.motivo', soloDetalle: true },
      { clave: 'creada', etiqueta: 'Creada', sql: 'ci.creado_en', tipo: 'fechaHora', soloDetalle: true },
      { clave: 'sede_id', etiqueta: 'sede_id', sql: 'ci.sede_id', interna: true },
      { clave: 'servicio_id', etiqueta: 'servicio_id', sql: 'ci.servicio_id', interna: true },
      { clave: 'medico_id', etiqueta: 'medico_id', sql: 'ci.medico_id', interna: true },
    ],
  },
  servicios: {
    etiqueta: 'Servicios',
    singular: 'servicio',
    desde: 'FROM servicio sv JOIN categoria_servicio cat ON cat.id = sv.categoria_id',
    id: 'sv.id',
    orden: 'sv.nombre',
    buscar: ['sv.nombre', 'sv.descripcion', 'cat.nombre'],
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre', sql: 'sv.nombre' },
      { clave: 'categoria', etiqueta: 'Categoría', sql: 'cat.nombre' },
      { clave: 'precio', etiqueta: 'Precio', sql: 'sv.precio', tipo: 'dinero' },
      { clave: 'duracion', etiqueta: 'Duración (min)', sql: 'sv.duracion_minutos', tipo: 'numero' },
      { clave: 'activo', etiqueta: 'Activo', sql: 'sv.activo', tipo: 'booleano', opciones: SI_NO },
      { clave: 'descripcion', etiqueta: 'Descripción', sql: 'sv.descripcion', soloDetalle: true },
    ],
  },
  sedes: {
    etiqueta: 'Sedes',
    singular: 'sede',
    desde: 'FROM sede s',
    id: 's.id',
    orden: 's.es_principal DESC, s.nombre',
    buscar: ['s.nombre', 's.ciudad', 's.direccion', 's.codigo'],
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre', sql: 's.nombre' },
      { clave: 'ciudad', etiqueta: 'Ciudad', sql: 's.ciudad' },
      { clave: 'codigo', etiqueta: 'Código', sql: 's.codigo' },
      { clave: 'direccion', etiqueta: 'Dirección', sql: 's.direccion' },
      { clave: 'principal', etiqueta: 'Principal', sql: 's.es_principal', tipo: 'booleano' },
      { clave: 'activo', etiqueta: 'Activa', sql: 's.activo', tipo: 'booleano', opciones: SI_NO },
    ],
  },
  horarios: {
    etiqueta: 'Horarios de atención',
    singular: 'horario',
    desde: 'FROM horario_atencion h JOIN sede s ON s.id = h.sede_id',
    id: 'h.id',
    orden: 's.nombre, h.dia_semana',
    buscar: ['s.nombre', DIA],
    columnas: [
      { clave: 'sede', etiqueta: 'Sede', sql: 's.nombre' },
      { clave: 'dia', etiqueta: 'Día', sql: DIA },
      { clave: 'abre', etiqueta: 'Abre', sql: `to_char(h.hora_inicio, 'HH24:MI')` },
      { clave: 'cierra', etiqueta: 'Cierra', sql: `to_char(h.hora_fin, 'HH24:MI')` },
    ],
  },
};

const columnasDe = (entidad, { detalle = false } = {}) => entidad.columnas.filter((c) => detalle || (!c.soloDetalle && !c.interna));

// Arma el WHERE validado: busqueda, filtros de columnas con opciones y
// relaciones (ej. las citas de un cliente).
function condiciones(entidad, { busqueda, filtros = {}, relaciones = {} }) {
  const partes = [];
  const valores = [];
  if (busqueda) {
    valores.push(`%${busqueda}%`);
    partes.push(`(${entidad.buscar.map((sql) => `${sql}::text ILIKE $${valores.length}`).join(' OR ')})`);
  }
  entidad.columnas
    .filter((c) => c.opciones && filtros[c.clave] !== undefined && filtros[c.clave] !== '')
    .forEach((c) => {
      // Solo se acepta un valor de la lista de opciones de esa columna.
      if (!c.opciones.some((o) => o.valor === filtros[c.clave])) return;
      valores.push(filtros[c.clave]);
      partes.push(`${c.sql}::text = $${valores.length}`);
    });
  Object.entries(entidad.relaciones || {}).forEach(([clave, sql]) => {
    if (!relaciones[clave]) return;
    valores.push(relaciones[clave]);
    partes.push(`${sql}::text = $${valores.length}`);
  });
  return { donde: partes.length ? `WHERE ${partes.join(' AND ')}` : '', valores };
}

function ordenValido(entidad, orden, direccion) {
  const columna = columnasDe(entidad).find((c) => c.clave === orden);
  if (!columna) return entidad.orden;
  return `${columna.sql} ${direccion === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
}

async function listar(nombre, { busqueda, filtros, relaciones, orden, direccion, limite, desplazamiento }) {
  const entidad = ENTIDADES[nombre];
  const { donde, valores } = condiciones(entidad, { busqueda, filtros, relaciones });
  const seleccion = entidad.columnas
    .filter((c) => c.enFilas || (!c.soloDetalle && !c.interna))
    .map((c) => `${c.sql} AS "${c.clave}"`)
    .join(', ');
  const paginado = limite ? `LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}` : '';
  const [filas, total] = await Promise.all([
    pool.query(
      `SELECT ${entidad.id} AS id, ${seleccion} ${entidad.desde} ${donde} ORDER BY ${ordenValido(entidad, orden, direccion)} ${paginado}`,
      limite ? [...valores, limite, desplazamiento] : valores
    ),
    pool.query(`SELECT COUNT(*)::int AS total ${entidad.desde} ${donde}`, valores),
  ]);
  return { filas: filas.rows, total: total.rows[0].total };
}

async function obtener(nombre, id) {
  const entidad = ENTIDADES[nombre];
  const seleccion = entidad.columnas.map((c) => `${c.sql} AS "${c.clave}"`).join(', ');
  const resultado = await pool.query(`SELECT ${entidad.id} AS id, ${seleccion} ${entidad.desde} WHERE ${entidad.id}::text = $1`, [id]);
  return resultado.rows[0] || null;
}

// ------------------------------------------------------------ correcciones
async function buscarUsuario(id) {
  const resultado = await pool.query('SELECT id, nombre_completo, correo, telefono, rol, sede_id, activo FROM usuario WHERE id::text = $1', [id]);
  return resultado.rows[0] || null;
}

async function buscarMascota(id) {
  const resultado = await pool.query('SELECT id, nombre, cliente_id, activo FROM mascota WHERE id::text = $1', [id]);
  return resultado.rows[0] || null;
}

async function buscarCita(id) {
  const resultado = await pool.query(
    'SELECT id, codigo, estado, fecha_hora, medico_id, sede_id, servicio_id, cliente_id, mascota_id FROM cita WHERE id::text = $1',
    [id]
  );
  return resultado.rows[0] || null;
}

async function corregirUsuario(id, { nombreCompleto, telefono, correo }) {
  const resultado = await pool.query(
    `UPDATE usuario
     SET nombre_completo = COALESCE($2::varchar, nombre_completo),
         telefono = CASE WHEN $3::boolean THEN $4::varchar ELSE telefono END,
         correo = COALESCE($5::varchar, correo)
     WHERE id = $1
     RETURNING id, nombre_completo, correo, telefono`,
    [id, nombreCompleto ?? null, telefono !== undefined, telefono || null, correo ?? null]
  );
  return resultado.rows[0];
}

// La mascota y TODAS sus citas pasan al dueño nuevo, en una sola
// transaccion: una cita no puede quedar a nombre de quien ya no es el dueño.
async function reasignarMascota(mascotaId, clienteId) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('UPDATE mascota SET cliente_id = $2 WHERE id = $1', [mascotaId, clienteId]);
    const citas = await cliente.query('UPDATE cita SET cliente_id = $2, actualizado_en = NOW() WHERE mascota_id = $1', [mascotaId, clienteId]);
    await cliente.query('COMMIT');
    return { citasMovidas: citas.rowCount };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function reactivarMascota(id) {
  await pool.query('UPDATE mascota SET activo = true WHERE id = $1', [id]);
}

async function cambiarEstadoCita(id, estado) {
  await pool.query('UPDATE cita SET estado = $2, actualizado_en = NOW() WHERE id = $1', [id, estado]);
}

async function cambiarMedicoCita(id, medicoId) {
  await pool.query('UPDATE cita SET medico_id = $2, actualizado_en = NOW() WHERE id = $1', [id, medicoId]);
}

// Medicos activos de la sede de la cita que prestan su servicio (candidatos
// para reasignarla).
async function medicosParaCita(cita) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre_completo
     FROM usuario u JOIN servicio_medico sm ON sm.medico_id = u.id AND sm.servicio_id = $2
     WHERE u.rol = 'veterinario' AND u.activo AND u.sede_id = $1
     ORDER BY u.nombre_completo`,
    [cita.sede_id, cita.servicio_id]
  );
  return resultado.rows;
}

module.exports = {
  ENTIDADES,
  columnasDe,
  listar,
  obtener,
  buscarUsuario,
  buscarMascota,
  buscarCita,
  corregirUsuario,
  reasignarMascota,
  reactivarMascota,
  cambiarEstadoCita,
  cambiarMedicoCita,
  medicosParaCita,
};
