// controllers/sede.controller.js
// RF-03: informacion accesible sin autenticacion (aqui, listado de
// sedes); RF-13 (ampliacion): gestion de sedes exclusiva del
// administrador, sin restriccion de "mi propia sede" (mismo criterio
// que ya tenian los horarios de atencion).
//
// Incremento 4 (flujo de agendamiento): codigo corto de la sede (se usa
// en el consecutivo de la cita, CV-BGA-2026-00045), sede principal y
// amenidades (parqueadero, sala de espera pet friendly).
const sedeModel = require('../models/sede.model');

// 2 a 5 letras mayusculas, sin tildes (va dentro del codigo de la cita).
const PATRON_CODIGO = /^[A-Z]{2,5}$/;

function normalizarCodigo(codigo) {
  return typeof codigo === 'string' ? codigo.trim().toUpperCase() : codigo;
}

function manejarDuplicado(error, res) {
  if (error.code === '23505') {
    res.status(409).json({ mensaje: 'Ya existe otra sede con ese código.' });
    return true;
  }
  return false;
}

// GET /api/sedes — publico, solo activas
async function listar(req, res, next) {
  try {
    const sedes = await sedeModel.listarTodas();
    return res.status(200).json({ sedes });
  } catch (error) {
    next(error);
  }
}

// GET /api/sedes/admin — solo administrador, incluye inactivas
async function listarAdmin(req, res, next) {
  try {
    const sedes = await sedeModel.listarTodasAdmin();
    return res.status(200).json({ sedes });
  } catch (error) {
    next(error);
  }
}

// POST /api/sedes — solo administrador
async function crear(req, res, next) {
  try {
    const { nombre, ciudad, direccion, fotoUrl, esPrincipal, tieneParqueadero, salaPetFriendly } = req.body;
    const codigo = normalizarCodigo(req.body.codigo);
    if (!nombre || !ciudad || !codigo) {
      return res.status(400).json({ mensaje: 'El nombre, la ciudad y el código de la sede son obligatorios.' });
    }
    if (!PATRON_CODIGO.test(codigo)) {
      return res.status(400).json({ mensaje: 'El código debe tener de 2 a 5 letras, sin tildes (ej. BGA).' });
    }

    const sede = await sedeModel.crear({ nombre, ciudad, direccion, fotoUrl, codigo, esPrincipal, tieneParqueadero, salaPetFriendly });
    return res.status(201).json({ sede });
  } catch (error) {
    if (manejarDuplicado(error, res)) return undefined;
    next(error);
  }
}

// PUT /api/sedes/:id — solo administrador
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, ciudad, direccion, fotoUrl, activo, esPrincipal, tieneParqueadero, salaPetFriendly } = req.body;
    const codigo = normalizarCodigo(req.body.codigo);
    if (codigo !== undefined && !PATRON_CODIGO.test(codigo)) {
      return res.status(400).json({ mensaje: 'El código debe tener de 2 a 5 letras, sin tildes (ej. BGA).' });
    }

    const sede = await sedeModel.actualizar(id, {
      nombre,
      ciudad,
      direccion,
      fotoUrl,
      activo,
      codigo,
      esPrincipal,
      tieneParqueadero,
      salaPetFriendly,
    });
    if (!sede) {
      return res.status(404).json({ mensaje: 'Sede no encontrada.' });
    }

    return res.status(200).json({ sede });
  } catch (error) {
    if (manejarDuplicado(error, res)) return undefined;
    next(error);
  }
}

module.exports = { listar, listarAdmin, crear, actualizar };
