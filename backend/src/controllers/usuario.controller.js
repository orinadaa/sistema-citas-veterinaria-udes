// controllers/usuario.controller.js
// RF-04 (gestion de roles), RF-05 (restriccion por rol).
// Crear personal (administrador/veterinario) y reasignar roles son acciones
// exclusivas del administrador; se protegen con verificarRol('administrador')
// en las rutas.

const bcrypt = require('bcryptjs');
const {
  buscarPorId,
  crearPersonal,
  listarTodos,
  actualizarRol,
} = require('../models/usuario.model');

const ROLES_VALIDOS = ['administrador', 'veterinario', 'cliente'];
const RONDAS_SAL = 10;

// GET /api/auth/perfil
async function obtenerPerfilPropio(req, res, next) {
  try {
    const usuario = await buscarPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
}

// GET /api/usuarios (solo administrador)
async function listar(req, res, next) {
  try {
    const usuarios = await listarTodos();
    return res.status(200).json({ usuarios });
  } catch (error) {
    next(error);
  }
}

// POST /api/usuarios (solo administrador) — alta de personal administrativo/veterinario
async function crearStaff(req, res, next) {
  try {
    const { nombreCompleto, correo, contrasena, rol, sedeId, telefono } = req.body;

    if (!nombreCompleto || !correo || !contrasena || !rol || !sedeId) {
      return res.status(400).json({
        mensaje: 'Nombre completo, correo, contraseña, rol y sede son obligatorios.',
      });
    }
    if (rol !== 'administrador' && rol !== 'veterinario') {
      return res.status(400).json({
        mensaje: 'Este endpoint solo crea cuentas de administrador o veterinario. Para clientes use /api/auth/registro.',
      });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const nuevoUsuario = await crearPersonal({
      nombreCompleto,
      correo,
      contrasenaHash,
      rol,
      sedeId,
      telefono,
    });

    return res.status(201).json({ usuario: nuevoUsuario });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }
    next(error);
  }
}

// PATCH /api/usuarios/:id/rol (solo administrador) — HU-04
async function cambiarRol(req, res, next) {
  try {
    const { id } = req.params;
    const { rol, sedeId } = req.body;

    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ mensaje: `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.` });
    }
    if (rol !== 'cliente' && !sedeId) {
      return res.status(400).json({ mensaje: 'Los roles administrador y veterinario requieren una sede.' });
    }

    const usuarioActualizado = await actualizarRol(id, { rol, sedeId: rol === 'cliente' ? null : sedeId });
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ usuario: usuarioActualizado });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfilPropio, listar, crearStaff, cambiarRol };
