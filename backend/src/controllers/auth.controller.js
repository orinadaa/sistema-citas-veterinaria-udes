// controllers/auth.controller.js
// RF-01 (registro de clientes), RF-02 (inicio de sesion).
// El registro publico solo crea usuarios con rol "cliente": las cuentas de
// administrador/veterinario las crea un administrador (ver usuario.controller.js).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buscarPorCorreo, crearCliente } = require('../models/usuario.model');

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RONDAS_SAL = 10;

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, sedeId: usuario.sede_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRACION || '8h' }
  );
}

function datosPublicos(usuario) {
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombre_completo,
    correo: usuario.correo,
    rol: usuario.rol,
    sedeId: usuario.sede_id || null,
  };
}

// POST /api/auth/registro
async function registrar(req, res, next) {
  try {
    const { nombreCompleto, correo, contrasena, telefono } = req.body;

    if (!nombreCompleto || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre completo, correo y contraseña son obligatorios.' });
    }
    if (!CORREO_REGEX.test(correo)) {
      return res.status(400).json({ mensaje: 'El correo electrónico no tiene un formato válido.' });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const existente = await buscarPorCorreo(correo);
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const nuevoUsuario = await crearCliente({ nombreCompleto, correo, contrasenaHash, telefono });

    const usuarioCompleto = { ...nuevoUsuario, sede_id: null };
    const token = generarToken(usuarioCompleto);

    return res.status(201).json({ usuario: datosPublicos(usuarioCompleto), token });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function iniciarSesion(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    const usuario = await buscarPorCorreo(correo);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    const token = generarToken(usuario);
    return res.status(200).json({ usuario: datosPublicos(usuario), token });
  } catch (error) {
    next(error);
  }
}

module.exports = { registrar, iniciarSesion };
