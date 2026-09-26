// controllers/mascota.controller.js
// El cliente gestiona sus propias mascotas; el administrador puede
// verlas/crearlas/editarlas para cualquier cliente (pantalla de
// Pacientes del panel administrativo).
const mascotaModel = require('../models/mascota.model');
const usuarioModel = require('../models/usuario.model');

const SEXOS_VALIDOS = ['macho', 'hembra'];

function pesoValido(peso) {
  const numero = Number(peso);
  return Number.isFinite(numero) && numero > 0;
}

// GET /api/mascotas/mias — solo cliente
async function misMascotas(req, res, next) {
  try {
    const mascotas = await mascotaModel.listarPorCliente(req.usuario.id);
    return res.status(200).json({ mascotas });
  } catch (error) {
    next(error);
  }
}

// GET /api/mascotas?clienteId=... — solo administrador
async function listarDeCliente(req, res, next) {
  try {
    const { clienteId } = req.query;
    if (!clienteId) {
      return res.status(400).json({ mensaje: 'clienteId es obligatorio.' });
    }

    const mascotas = await mascotaModel.listarPorCliente(clienteId);
    return res.status(200).json({ mascotas });
  } catch (error) {
    next(error);
  }
}

// POST /api/mascotas — el cliente crea la propia; el administrador
// indica clienteId explicitamente (debe ser una cuenta cliente real).
async function crear(req, res, next) {
  try {
    const esAdmin = req.usuario.rol === 'administrador';
    const {
      nombre,
      especie,
      raza,
      fotoUrl,
      fechaNacimiento,
      sexo,
      color,
      pesoKg,
      caracteristicas,
      clienteId: clienteIdBody,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre de la mascota es obligatorio.' });
    }
    if (sexo && !SEXOS_VALIDOS.includes(sexo)) {
      return res.status(400).json({ mensaje: `El sexo debe ser uno de: ${SEXOS_VALIDOS.join(', ')}.` });
    }
    if (pesoKg !== undefined && pesoKg !== null && pesoKg !== '' && !pesoValido(pesoKg)) {
      return res.status(400).json({ mensaje: 'El peso debe ser un número mayor a 0.' });
    }

    let clienteId = req.usuario.id;
    if (esAdmin) {
      if (!clienteIdBody) {
        return res.status(400).json({ mensaje: 'clienteId es obligatorio al crear una mascota desde el panel administrativo.' });
      }
      const cliente = await usuarioModel.buscarPorId(clienteIdBody);
      if (!cliente || cliente.rol !== 'cliente') {
        return res.status(404).json({ mensaje: 'El cliente indicado no existe.' });
      }
      clienteId = clienteIdBody;
    }

    const mascota = await mascotaModel.crear({
      clienteId,
      nombre,
      especie,
      raza,
      fotoUrl,
      fechaNacimiento,
      sexo,
      color,
      pesoKg: pesoKg || null,
      caracteristicas,
    });
    return res.status(201).json({ mascota });
  } catch (error) {
    next(error);
  }
}

// PUT /api/mascotas/:id — el cliente solo puede editar la suya; el
// administrador puede editar cualquiera.
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, especie, raza, fotoUrl, fechaNacimiento, sexo, color, pesoKg, caracteristicas } = req.body;
    const esAdmin = req.usuario.rol === 'administrador';

    if (sexo && !SEXOS_VALIDOS.includes(sexo)) {
      return res.status(400).json({ mensaje: `El sexo debe ser uno de: ${SEXOS_VALIDOS.join(', ')}.` });
    }
    if (pesoKg !== undefined && pesoKg !== null && pesoKg !== '' && !pesoValido(pesoKg)) {
      return res.status(400).json({ mensaje: 'El peso debe ser un número mayor a 0.' });
    }

    const mascota = await mascotaModel.buscarPorId(id);
    if (!mascota) {
      return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    }
    if (!esAdmin && mascota.cliente_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes editar una mascota que no es tuya.' });
    }

    const actualizada = await mascotaModel.actualizar(id, {
      nombre,
      especie,
      raza,
      fotoUrl,
      fechaNacimiento,
      sexo,
      color,
      pesoKg: pesoKg || null,
      caracteristicas,
    });
    return res.status(200).json({ mascota: actualizada });
  } catch (error) {
    next(error);
  }
}

module.exports = { misMascotas, listarDeCliente, crear, actualizar };
