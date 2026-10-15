// controllers/perfilMedico.controller.js
// "Mi perfil" del medico veterinario (/api/medico/perfil). Decisiones de la
// usuaria.
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuario.model');
const perfilModel = require('../models/perfilMedico.model');
const correoService = require('../services/correo.service');
const { generarCodigoRecuperacion, errorContrasena } = require('../utils/contrasena.util');
const { generarToken } = require('../utils/token');
const { errorTelefono } = require('../utils/validacion');
const { fotosUsuarios } = require('../middlewares/subirFoto.middleware');

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RONDAS_SAL = 10;
const MINUTOS_VIGENCIA_CODIGO = 15;
const MAXIMO_INTENTOS_CODIGO = 5;
const ANIOS_EXPERIENCIA = ['0-1', '1-3', '3-5', '5-10', '10+'];
const LIMITES = { nombreCompleto: 150, telefono: 20, direccion: 200, titulosProfesionales: 500, registroProfesional: 50, biografia: 500 };

// GET /api/medico/perfil
async function obtenerPerfil(req, res, next) {
  try {
    const perfil = await perfilModel.obtener(req.usuario.id);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado.' });
    return res.status(200).json({ perfil });
  } catch (error) {
    next(error);
  }
}

// PUT /api/medico/perfil — actualizacion parcial (cada seccion del
// perfil guarda solo sus campos). Correo, sede, especialidades y
// servicios no se aceptan aqui.
async function actualizarPerfil(req, res, next) {
  try {
    const campos = {};
    for (const clave of Object.keys(LIMITES).concat('aniosExperiencia')) {
      if (req.body[clave] === undefined) continue;
      const valor = req.body[clave] === null ? '' : clave === 'telefono' ? String(req.body[clave]) : String(req.body[clave]).trim();
      if (LIMITES[clave] && valor.length > LIMITES[clave]) {
        return res.status(400).json({ mensaje: `El campo ${clave} supera los ${LIMITES[clave]} caracteres.` });
      }
      campos[clave] = valor;
    }
    if (campos.nombreCompleto !== undefined && !campos.nombreCompleto) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
    }
    if (campos.telefono !== undefined && !campos.telefono) {
      return res.status(400).json({ mensaje: 'El teléfono es obligatorio.' });
    }
    const problemaTelefono = errorTelefono(campos.telefono);
    if (problemaTelefono) return res.status(400).json({ mensaje: problemaTelefono });
    if (campos.aniosExperiencia && !ANIOS_EXPERIENCIA.includes(campos.aniosExperiencia)) {
      return res.status(400).json({ mensaje: 'Elige un rango de años de experiencia válido.' });
    }

    const perfil = await perfilModel.actualizar(req.usuario.id, campos);
    return res.status(200).json({ perfil });
  } catch (error) {
    next(error);
  }
}

// POST /api/medico/perfil/foto — multipart, campo "foto"
async function subirFotoPerfil(req, res, next) {
  const archivoNuevo = req.file ? `${fotosUsuarios.rutaPublica}/${req.file.filename}` : null;
  try {
    if (!archivoNuevo) {
      return res.status(400).json({ mensaje: 'Adjunta una imagen JPG o PNG en el campo "foto".' });
    }
    const anterior = await perfilModel.actualizarFoto(req.usuario.id, archivoNuevo);
    await fotosUsuarios.borrar(anterior);
    return res.status(200).json({ fotoUrl: archivoNuevo });
  } catch (error) {
    await fotosUsuarios.borrar(archivoNuevo);
    next(error);
  }
}

// PUT /api/medico/perfil/contrasena — { actual, nueva }
async function cambiarContrasena(req, res, next) {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) {
      return res.status(400).json({ mensaje: 'La contraseña actual y la nueva son obligatorias.' });
    }
    const problema = errorContrasena(nueva);
    if (problema) {
      return res.status(400).json({ mensaje: problema });
    }
    const hash = await perfilModel.obtenerHashContrasena(req.usuario.id);
    if (!hash || !(await bcrypt.compare(actual, hash))) {
      return res.status(400).json({ mensaje: 'La contraseña actual no es correcta.' });
    }
    if (await bcrypt.compare(nueva, hash)) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe ser distinta a la actual.' });
    }
    await usuarioModel.actualizarContrasena(req.usuario.id, await bcrypt.hash(nueva, RONDAS_SAL));
    // El cambio cierra las demas sesiones de la cuenta; esta sigue con un
    // token nuevo (el frontend lo toma de tokenRenovado).
    const cuenta = await usuarioModel.buscarPorId(req.usuario.id);
    return res.status(200).json({ mensaje: 'Contraseña actualizada.', tokenRenovado: cuenta ? generarToken(cuenta) : undefined });
  } catch (error) {
    next(error);
  }
}

// POST /api/medico/perfil/correo — { correoNuevo }: envia el codigo al
// correo nuevo. El correo de la cuenta NO cambia todavia.
async function solicitarCambioCorreo(req, res, next) {
  try {
    const correoNuevo = String(req.body.correoNuevo || '').trim().toLowerCase();
    if (!CORREO_REGEX.test(correoNuevo)) {
      return res.status(400).json({ mensaje: 'Escribe un correo válido.' });
    }
    const actual = await usuarioModel.buscarPorId(req.usuario.id);
    if (actual.correo.toLowerCase() === correoNuevo) {
      return res.status(400).json({ mensaje: 'Ese ya es tu correo actual.' });
    }
    if (await usuarioModel.buscarPorCorreo(correoNuevo)) {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado en otra cuenta.' });
    }

    const codigo = generarCodigoRecuperacion();
    const expiraEn = new Date(Date.now() + MINUTOS_VIGENCIA_CODIGO * 60 * 1000);
    await perfilModel.guardarVerificacionCorreo(req.usuario.id, correoNuevo, await bcrypt.hash(codigo, RONDAS_SAL), expiraEn);

    try {
      await correoService.enviarCodigoCambioCorreo({ correo: correoNuevo, nombreCompleto: actual.nombre_completo, codigo });
    } catch (error) {
      console.error('No se pudo enviar el codigo de cambio de correo:', error.message);
      return res.status(502).json({ mensaje: 'No se pudo enviar el código a ese correo. Revisa que esté bien escrito.' });
    }
    return res.status(200).json({ mensaje: `Enviamos un código de 6 dígitos a ${correoNuevo}. Vence en ${MINUTOS_VIGENCIA_CODIGO} minutos.` });
  } catch (error) {
    next(error);
  }
}

// POST /api/medico/perfil/correo/confirmar — { codigo }: si es correcto,
// aplica el correo nuevo.
async function confirmarCambioCorreo(req, res, next) {
  try {
    const codigo = String(req.body.codigo || '').trim();
    const registro = await perfilModel.buscarVerificacionCorreo(req.usuario.id);
    const invalido = { mensaje: 'Código inválido o expirado. Solicita uno nuevo.' };
    if (!codigo || !registro || registro.intentos >= MAXIMO_INTENTOS_CODIGO || new Date(registro.expira_en) < new Date()) {
      return res.status(400).json(invalido);
    }
    if (!(await bcrypt.compare(codigo, registro.codigo_hash))) {
      await perfilModel.incrementarIntentosCorreo(req.usuario.id);
      return res.status(400).json(invalido);
    }
    // Pudo registrarse otra cuenta con ese correo mientras tanto.
    if (await usuarioModel.buscarPorCorreo(registro.correo_nuevo)) {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado en otra cuenta.' });
    }
    await perfilModel.confirmarCambioCorreo(req.usuario.id, registro.correo_nuevo);
    return res.status(200).json({ correo: registro.correo_nuevo, mensaje: 'Tu correo quedó actualizado y verificado.' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado en otra cuenta.' });
    }
    next(error);
  }
}

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  subirFotoPerfil,
  cambiarContrasena,
  solicitarCambioCorreo,
  confirmarCambioCorreo,
};
