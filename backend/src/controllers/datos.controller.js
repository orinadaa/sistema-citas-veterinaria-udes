// controllers/datos.controller.js
// Modulo "Datos" del superadministrador (/api/datos):
// - explorar cualquier entidad en solo lectura, con busqueda, filtros,
//   orden y paginas, y exportarla a CSV;
// - correcciones puntuales, cada una con sus reglas;
// - bitacora de cambios y copia de seguridad.
// No hay edicion libre de tablas ni eliminacion de registros.
const { spawn } = require('child_process');
const datosModel = require('../models/datos.model');
const bitacoraModel = require('../models/bitacora.model');

const POR_PAGINA = 25;
const MAXIMO_EXPORTAR = 5000;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function entidadDe(req, res) {
  const entidad = datosModel.ENTIDADES[req.params.entidad];
  if (!entidad) {
    res.status(404).json({ mensaje: 'Esa entidad no existe.' });
    return null;
  }
  return entidad;
}

// Lo que el navegador puede pedir: busqueda, pagina, orden y filtros/relaciones
// (estos dos se validan en el modelo contra la descripcion de la entidad).
function opcionesDe(req) {
  const { busqueda, pagina, orden, direccion, ...resto } = req.query;
  return {
    busqueda: String(busqueda || '').trim() || null,
    pagina: Math.max(1, parseInt(pagina, 10) || 1),
    orden,
    direccion: direccion === 'desc' ? 'desc' : 'asc',
    filtros: resto,
    relaciones: resto,
  };
}

const describir = (columnas) => columnas.map(({ clave, etiqueta, tipo = 'texto', opciones }) => ({ clave, etiqueta, tipo, opciones }));

// GET /api/datos — que entidades se pueden explorar
function listarEntidades(req, res) {
  const entidades = Object.entries(datosModel.ENTIDADES).map(([nombre, e]) => ({
    nombre,
    etiqueta: e.etiqueta,
    columnas: describir(datosModel.columnasDe(e)),
  }));
  return res.status(200).json({ entidades });
}

// GET /api/datos/:entidad?busqueda=&pagina=&orden=&direccion=&<filtros>
async function listar(req, res, next) {
  try {
    if (!entidadDe(req, res)) return;
    const opciones = opcionesDe(req);
    const { filas, total } = await datosModel.listar(req.params.entidad, {
      ...opciones,
      limite: POR_PAGINA,
      desplazamiento: (opciones.pagina - 1) * POR_PAGINA,
    });
    return res.status(200).json({ filas, total, pagina: opciones.pagina, porPagina: POR_PAGINA });
  } catch (error) {
    next(error);
  }
}

// GET /api/datos/:entidad/:id — el registro completo
async function obtener(req, res, next) {
  try {
    const entidad = entidadDe(req, res);
    if (!entidad) return;
    const registro = await datosModel.obtener(req.params.entidad, req.params.id);
    if (!registro) return res.status(404).json({ mensaje: 'Registro no encontrado.' });
    const columnas = describir(entidad.columnas.filter((c) => !c.interna));
    return res.status(200).json({ registro, columnas });
  } catch (error) {
    next(error);
  }
}

// --- exportacion -------------------------------------------------------
function celdaCsv(valor, tipo) {
  if (valor === null || valor === undefined) return '';
  let texto;
  if (tipo === 'booleano') texto = valor ? 'Sí' : 'No';
  else if (valor instanceof Date) texto = tipo === 'fecha' ? valor.toLocaleDateString('es-CO') : valor.toLocaleString('es-CO');
  else texto = String(valor);
  // Una celda que empieza con = + - @ se abriria como formula en Excel.
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// GET /api/datos/:entidad/exportar — CSV con los mismos filtros de la vista
async function exportar(req, res, next) {
  try {
    const entidad = entidadDe(req, res);
    if (!entidad) return;
    const opciones = opcionesDe(req);
    const { filas } = await datosModel.listar(req.params.entidad, { ...opciones, limite: MAXIMO_EXPORTAR, desplazamiento: 0 });
    const columnas = datosModel.columnasDe(entidad);
    // Punto y coma y BOM: asi Excel en español lo abre en columnas y con tildes.
    const lineas = [columnas.map((c) => celdaCsv(c.etiqueta)).join(';'), ...filas.map((fila) => columnas.map((c) => celdaCsv(fila[c.clave], c.tipo)).join(';'))];
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entidad}-${fecha}.csv"`);
    return res.status(200).send(`﻿${lineas.join('\r\n')}\r\n`);
  } catch (error) {
    next(error);
  }
}

// --- bitacora ----------------------------------------------------------
// GET /api/datos/bitacora?busqueda=&pagina=
async function listarBitacora(req, res, next) {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const { filas, total } = await bitacoraModel.listar({
      busqueda: String(req.query.busqueda || '').trim() || null,
      limite: POR_PAGINA,
      desplazamiento: (pagina - 1) * POR_PAGINA,
    });
    return res.status(200).json({ filas, total, pagina, porPagina: POR_PAGINA });
  } catch (error) {
    next(error);
  }
}

// --- copia de seguridad ------------------------------------------------
// GET /api/datos/respaldo — descarga un .sql con toda la base (pg_dump).
// Restaurarla no se hace desde el sistema: es una operacion manual.
function respaldo(req, res) {
  const ejecutable = process.env.PG_DUMP_PATH || 'pg_dump';
  const argumentos = ['--no-owner', '--no-privileges', '-h', process.env.DB_HOST, '-p', String(process.env.DB_PORT || 5432), '-U', process.env.DB_USER, process.env.DB_NAME];
  const proceso = spawn(ejecutable, argumentos, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } });
  let empezo = false;
  let errores = '';

  const fallar = (detalle) => {
    if (empezo || res.headersSent) return res.end();
    return res.status(500).json({
      mensaje: `No se pudo generar la copia de seguridad. Verifica que pg_dump esté instalado o indica su ruta en PG_DUMP_PATH (backend/.env). ${detalle}`.trim(),
    });
  };

  proceso.on('error', (error) => fallar(error.code === 'ENOENT' ? 'No se encontró pg_dump.' : error.message));
  proceso.stderr.on('data', (dato) => {
    errores += dato;
  });
  proceso.stdout.once('data', () => {
    empezo = true;
    const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="respaldo-clinica-${fecha}.sql"`);
  });
  proceso.stdout.pipe(res, { end: false });
  proceso.on('close', (codigo) => (codigo === 0 ? res.end() : fallar(errores.split('\n')[0] || '')));
}

// --- correcciones ------------------------------------------------------
// PUT /api/datos/usuarios/:id/corregir — nombre, telefono y/o correo
async function corregirUsuario(req, res, next) {
  try {
    const usuario = await datosModel.buscarUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    if (usuario.rol === 'superadministrador') {
      return res.status(403).json({ mensaje: 'La cuenta del superadministrador no se corrige desde aquí.' });
    }
    const nombreCompleto = req.body.nombreCompleto === undefined ? undefined : String(req.body.nombreCompleto).trim();
    const correo = req.body.correo === undefined ? undefined : String(req.body.correo).trim().toLowerCase();
    const telefono = req.body.telefono === undefined ? undefined : String(req.body.telefono).trim();
    if (nombreCompleto === '') return res.status(400).json({ mensaje: 'El nombre no puede quedar vacío.' });
    if (correo !== undefined && !CORREO_VALIDO.test(correo)) return res.status(400).json({ mensaje: 'El correo no tiene un formato válido.' });
    if (telefono && !/^[0-9+\s-]{7,20}$/.test(telefono)) return res.status(400).json({ mensaje: 'El teléfono solo admite números, espacios, + y -.' });
    if (nombreCompleto === undefined && correo === undefined && telefono === undefined) {
      return res.status(400).json({ mensaje: 'Indica al menos un dato para corregir.' });
    }
    const corregido = await datosModel.corregirUsuario(usuario.id, { nombreCompleto, telefono, correo });
    return res.status(200).json({ usuario: corregido });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ mensaje: 'Ya existe otra cuenta con ese correo.' });
    next(error);
  }
}

// PUT /api/datos/mascotas/:id/dueno — { clienteId }: la mascota (y sus citas) pasan a otro dueño
async function reasignarMascota(req, res, next) {
  try {
    const mascota = await datosModel.buscarMascota(req.params.id);
    if (!mascota) return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    const destino = req.body.clienteId ? await datosModel.buscarUsuario(String(req.body.clienteId)) : null;
    if (!destino || destino.rol !== 'cliente') return res.status(400).json({ mensaje: 'El nuevo dueño debe ser una cuenta de cliente.' });
    if (!destino.activo) return res.status(400).json({ mensaje: 'El nuevo dueño tiene la cuenta inactiva.' });
    if (destino.id === mascota.cliente_id) return res.status(400).json({ mensaje: 'Esa mascota ya pertenece a ese cliente.' });
    const { citasMovidas } = await datosModel.reasignarMascota(mascota.id, destino.id);
    return res.status(200).json({ mensaje: `${mascota.nombre} ahora pertenece a ${destino.nombre_completo}.`, citasMovidas });
  } catch (error) {
    next(error);
  }
}

// PUT /api/datos/mascotas/:id/reactivar — deshace una baja hecha por error
async function reactivarMascota(req, res, next) {
  try {
    const mascota = await datosModel.buscarMascota(req.params.id);
    if (!mascota) return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    if (mascota.activo) return res.status(400).json({ mensaje: 'Esa mascota ya está activa.' });
    await datosModel.reactivarMascota(mascota.id);
    return res.status(200).json({ mensaje: `${mascota.nombre} volvió a estar activa.` });
  } catch (error) {
    next(error);
  }
}

// GET /api/datos/citas/:id/medicos — a quien se le puede reasignar
async function medicosParaCita(req, res, next) {
  try {
    const cita = await datosModel.buscarCita(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    const medicos = await datosModel.medicosParaCita(cita);
    return res.status(200).json({ medicos, medicoActual: cita.medico_id });
  } catch (error) {
    next(error);
  }
}

// PUT /api/datos/citas/:id/corregir — { estado } y/o { medicoId }
async function corregirCita(req, res, next) {
  try {
    const cita = await datosModel.buscarCita(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    const { estado, medicoId } = req.body;
    if (estado === undefined && medicoId === undefined) return res.status(400).json({ mensaje: 'Indica el estado o el médico a corregir.' });
    if (estado !== undefined && !['agendada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ mensaje: 'El estado debe ser agendada o cancelada.' });
    }
    if (medicoId !== undefined && String(medicoId) !== cita.medico_id) {
      const candidatos = await datosModel.medicosParaCita(cita);
      if (!candidatos.some((m) => m.id === String(medicoId))) {
        return res.status(400).json({ mensaje: 'Ese médico no está activo en la sede de la cita o no presta ese servicio.' });
      }
      await datosModel.cambiarMedicoCita(cita.id, String(medicoId));
    }
    if (estado !== undefined && estado !== cita.estado) {
      await datosModel.cambiarEstadoCita(cita.id, estado);
    }
    return res.status(200).json({ mensaje: 'Cita corregida.' });
  } catch (error) {
    // Indice unico: un medico no puede tener dos citas agendadas a la misma hora.
    if (error.code === '23505') return res.status(409).json({ mensaje: 'Ese médico ya tiene otra cita agendada a esa misma hora.' });
    next(error);
  }
}

module.exports = {
  listarEntidades,
  listar,
  obtener,
  exportar,
  listarBitacora,
  respaldo,
  corregirUsuario,
  reasignarMascota,
  reactivarMascota,
  medicosParaCita,
  corregirCita,
};
