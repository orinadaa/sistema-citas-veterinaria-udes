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
  actualizarPerfil,
} = require('../models/usuario.model');
const correoService = require('../services/correo.service');
const { generarContrasenaTemporal } = require('../utils/contrasena.util');

const ROLES_VALIDOS = ['superadministrador', 'administrador', 'veterinario', 'cliente'];
// Roles que se pueden asignar desde el sistema. El superadministrador no:
// esa cuenta se crea aparte (src/scripts/crearSuperadmin.js).
const ROLES_ASIGNABLES = ['administrador', 'veterinario', 'cliente'];
const RONDAS_SAL = 10;
const ETIQUETA_ROL = { administrador: 'administrador', veterinario: 'médico veterinario' };

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

// GET /api/usuarios (solo administrador) — ?rol= filtra por rol, usado
// por ejemplo para listar clientes al agendar una cita desde el panel.
async function listar(req, res, next) {
  try {
    const { rol } = req.query;
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ mensaje: `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.` });
    }

    // El administrador de sede solo puede listar clientes.
    if (req.usuario.rol !== 'superadministrador' && rol !== 'cliente') {
      return res.status(403).json({ mensaje: 'No tiene permisos para acceder a este recurso.' });
    }

    const usuarios = await listarTodos(rol);
    return res.status(200).json({ usuarios });
  } catch (error) {
    next(error);
  }
}

// POST /api/usuarios (solo administrador) — alta de personal administrativo/veterinario
async function crearStaff(req, res, next) {
  try {
    const { nombreCompleto, correo, rol, sedeId, telefono } = req.body;

    if (!nombreCompleto || !correo || !rol || !sedeId) {
      return res.status(400).json({
        mensaje: 'Nombre completo, correo, rol y sede son obligatorios.',
      });
    }
    if (rol !== 'administrador' && rol !== 'veterinario') {
      return res.status(400).json({
        mensaje: 'Este endpoint solo crea cuentas de administrador o veterinario. Para clientes use /api/auth/registro.',
      });
    }

    // La contraseña nunca la escribe el admin: se autogenera y se envia
    // por correo (unica forma en que la persona se entera de su clave).
    const contrasenaTemporal = generarContrasenaTemporal();
    const contrasenaHash = await bcrypt.hash(contrasenaTemporal, RONDAS_SAL);
    const nuevoUsuario = await crearPersonal({
      nombreCompleto,
      correo,
      contrasenaHash,
      rol,
      sedeId,
      telefono,
    });

    let correoEnviado = true;
    try {
      await correoService.enviarCredenciales({
        correo,
        nombreCompleto,
        contrasenaTemporal,
        rolEtiqueta: ETIQUETA_ROL[rol],
      });
    } catch (error) {
      console.error('No se pudo enviar el correo de credenciales:', error.message);
      correoEnviado = false;
    }

    return res.status(201).json({ usuario: nuevoUsuario, correoEnviado });
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

    if (!ROLES_ASIGNABLES.includes(rol)) {
      return res.status(400).json({ mensaje: `El rol debe ser uno de: ${ROLES_ASIGNABLES.join(', ')}.` });
    }
    if (rol !== 'cliente' && !sedeId) {
      return res.status(400).json({ mensaje: 'Los roles administrador y veterinario requieren una sede.' });
    }
    // La cuenta del superadministrador no se degrada desde el sistema.
    const objetivo = await buscarPorId(id);
    if (objetivo && objetivo.rol === 'superadministrador') {
      return res.status(403).json({ mensaje: 'El rol del superadministrador no se puede cambiar desde el sistema.' });
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

// PATCH /api/usuarios/:id (solo superadministrador: es quien activa o desactiva cuentas) — activo/telefono/nombre,
// para cualquier rol (Configuracion->Usuarios, toggle de Pacientes). No
// cambia rol/sede (eso sigue siendo /:id/rol). Un admin no puede
// desactivarse a si mismo (evita auto-bloqueo).
async function actualizarPerfilUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { nombreCompleto, telefono, activo } = req.body;

    if (activo === false && id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
    }

    const usuarioActualizado = await actualizarPerfil(id, { nombreCompleto, telefono, activo });
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ usuario: usuarioActualizado });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfilPropio, listar, crearStaff, cambiarRol, actualizarPerfilUsuario };
